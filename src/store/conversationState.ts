import { create } from 'zustand';
import { AssistantTurn, Utterance } from '../services/types';
import { audioStreamer } from '../services/voice/audioStreamer';

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
 */
export function initVoice() {
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