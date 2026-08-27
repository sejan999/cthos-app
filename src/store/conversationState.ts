import { create } from 'zustand';
import { AssistantTurn, Utterance } from '../services/types';
import { audioStreamer } from '../services/voice/audioStreamer';
import { geminiReplyProvider } from '../services/ai/geminiLive';
import {
  commandRouter,
  registerSubAgentHandlers,
} from '../services/ai/commandRouter';

/**
 * In-memory conversation history for the current session. Populated by wiring
 * the voice session's onFinal + onReplyDone into this store (see initVoice()).
 * Persistence to disk lands in STEP 5.
 */
interface ConversationState {
  turns: AssistantTurn[];
  interim: string;
  engineState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'interruption';
  addTurn: (t: AssistantTurn) => void;
  setInterim: (s: string) => void;
  setEngineState: (s: ConversationState['engineState']) => void;
}

function mapState(raw: string): ConversationState['engineState'] {
  return (raw as ConversationState['engineState']) ?? 'idle';
}

export const useConversationStore = create<ConversationState>((set) => ({
  turns: [],
  interim: '',
  engineState: 'idle',
  addTurn: (t) => set((s) => ({ turns: [...s.turns, t] })),
  setInterim: (interim) => set({ interim }),
  setEngineState: (engineState) => set({ engineState }),
}));

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