import { create } from 'zustand';
import { AssistantTurn, Utterance } from '../services/types';
import { audioStreamer } from '../services/voice/audioStreamer';
import { geminiReplyProvider } from '../services/ai/geminiLive';
import {
  commandRouter,
  registerSubAgentHandlers,
} from '../services/ai/commandRouter';
import { ttsEngine } from '../services/voice/ttsEngine';
import { languageManager } from '../services/voice/languageManager';
import * as SecureStore from 'expo-secure-store';

/**
 * In-memory conversation history for the current session. Populated by wiring
 * the voice session's onFinal + onReplyDone into this store (see initVoice()).
 * The last MAX_PERSISTED_TURNS turns + active persona persist to encrypted
 * storage and rehydrate at boot (STEP 5 wiring).
 */
interface ConversationState {
  turns: AssistantTurn[];
  interim: string;
  engineState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'interruption';
  hydrated: boolean;
  addTurn: (t: AssistantTurn) => void;
  setInterim: (s: string) => void;
  setEngineState: (s: ConversationState['engineState']) => void;
}

const MAX_PERSISTED_TURNS = 30;
const PERSIST_KEY = 'cthos.conversation.v1';

function mapState(raw: string): ConversationState['engineState'] {
  return (raw as ConversationState['engineState']) ?? 'idle';
}

export const useConversationStore = create<ConversationState>((set) => ({
  turns: [],
  interim: '',
  engineState: 'idle',
  hydrated: false,
  addTurn: (t) =>
    set((s) => {
      const turns = [...s.turns, t];
      void persistTurns(turns);
      return { turns };
    }),
  setInterim: (interim) => set({ interim }),
  setEngineState: (engineState) => set({ engineState }),
}));

/* ------------------------------------------------------------------ */
/* Persistence helpers (STEP 5)                                        */
/* ------------------------------------------------------------------ */

async function persistTurns(turns: AssistantTurn[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      PERSIST_KEY,
      JSON.stringify({ turns: turns.slice(-MAX_PERSISTED_TURNS) }),
    );
  } catch (e) {
    console.warn('[Cthos:persist] failed to save history', e);
  }
}

/** Rehydrate last session's turns once at boot; safe to call repeatedly. */
let hydrationStarted = false;
export async function hydrateConversation(): Promise<void> {
  if (hydrationStarted) return;
  hydrationStarted = true;
  try {
    const raw = await SecureStore.getItemAsync(PERSIST_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { turns?: AssistantTurn[] };
    if (Array.isArray(parsed.turns) && parsed.turns.length) {
      useConversationStore.setState({
        turns: parsed.turns.slice(-MAX_PERSISTED_TURNS),
        hydrated: true,
      });
      return;
    }
  } catch (e) {
    console.warn('[Cthos:persist] failed to load history', e);
  }
  useConversationStore.setState({ hydrated: true });
}

/**
 * Bind the shared voice session to the UI stores. Call once at app start.
 *
 * Reply pipeline (STEP 4):
 *   commandRouter (routines + device automation, via subAgentWorker)
 *     -> geminiReplyProvider fallback (persona-aware chat brain)
 * When no API key is stored the brain falls back to a friendly "needs a key"
 * prompt instead of breaking the loop.
 */
export function initVoice() {
  registerSubAgentHandlers();
  commandRouter.setFallback(geminiReplyProvider);
  audioStreamer.setReplyProvider(commandRouter.handleUtterance);
  void hydrateConversation();

  let lastUser: Utterance | null = null;
  audioStreamer.on({
    onInterim: (u) => useConversationStore.getState().setInterim(u.text),
    onFinal: (u) => {
      lastUser = u;
      if (u.text.trim()) useConversationStore.getState().setInterim('');
    },
    onStateChange: (e) => useConversationStore.getState().setEngineState(mapState(e)),
    onReplyDone: (reply) => {
      if (lastUser && lastUser.text.trim()) {
        addTurnFrom(lastUser, reply);
        lastUser = null;
      }
    },
  });
}

/** Capture a completed exchange into the turn history. */
export function addTurnFrom(userTextRaw: Utterance | string, reply: string) {
  const userText = typeof userTextRaw === 'string' ? userTextRaw : userTextRaw.text;
  useConversationStore.getState().addTurn({
    userText,
    replyText: reply,
    tone: { tone: 'neutral', confidence: 0.4, hint: 'auto' },
    language: 'en',
    timestamp: Date.now(),
  });
}

/**
 * Typed-input path (STEP 5): the Dashboard text bar feeds the SAME reply
 * pipeline as voice — commandRouter (automation/routines) -> Gemini chat —
 * then records the exchange and speaks the reply via TTS.
 */
export async function submitText(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';
  useConversationStore.getState().setEngineState('thinking');
  try {
    const utterance: Utterance = {
      text: clean,
      language: languageManager.detect(clean),
      confidence: 1,
      timestamp: Date.now(),
    };
    const reply = await commandRouter.handleUtterance(utterance);
    addTurnFrom(clean, reply);
    void ttsEngine.speak(reply, utterance.language).catch(() => {});
    return reply;
  } catch (e) {
    console.warn('[Cthos:submitText] failed', e);
    return 'Something went wrong handling that.';
  } finally {
    useConversationStore.getState().setEngineState('idle');
  }
}
