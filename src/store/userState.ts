import { create } from 'zustand';
import { PersonaId } from '../services/types';
import { personalityManager } from '../services/ai/personalityManager';

/**
 * User-level runtime state — persona, voice engine flags, and high-level
 * conversation state. Persistence & hydration land in STEP 5 wiring.
 */

interface UserState {
  persona: PersonaId;
  voiceReady: boolean;
  micActive: boolean;
  currentLanguage: 'en' | 'hi';
  setPersona: (p: PersonaId) => void;
  setVoiceReady: (v: boolean) => void;
  setMicActive: (v: boolean) => void;
  setLanguage: (l: 'en' | 'hi') => void;
}

export const useUserStore = create<UserState>((set) => ({
  persona: personalityManager.current,
  voiceReady: false,
  micActive: false,
  currentLanguage: 'en',
  setPersona: (p) => {
    personalityManager.setPersona(p);
    set({ persona: p });
  },
  setVoiceReady: (v) => set({ voiceReady: v }),
  setMicActive: (v) => set({ micActive: v }),
  setLanguage: (l) => set({ currentLanguage: l }),
}));