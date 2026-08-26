import { create } from 'zustand';

/**
 * User-level runtime state — persona, voice engine flags, and high-level
 * conversation state. Persistence & hydration land in STEP 5 wiring.
 */

export type Persona = 'GF' | 'Professional' | 'Venom';

interface UserState {
  persona: Persona;
  voiceReady: boolean;
  micActive: boolean;
  currentLanguage: 'en' | 'hi';
  setPersona: (p: Persona) => void;
  setVoiceReady: (v: boolean) => void;
  setMicActive: (v: boolean) => void;
  setLanguage: (l: 'en' | 'hi') => void;
}

export const useUserStore = create<UserState>((set) => ({
  persona: 'Alex',
  voiceReady: false,
  micActive: false,
  currentLanguage: 'en',
  setPersona: (p) => set({ persona: p }),
  setVoiceReady: (v) => set({ voiceReady: v }),
  setMicActive: (v) => set({ micActive: v }),
  setLanguage: (l) => set({ currentLanguage: l }),
}));