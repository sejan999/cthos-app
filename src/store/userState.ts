import { create } from 'zustand';
import { PersonaId } from '../services/types';
import { personalityManager } from '../services/ai/personalityManager';
import * as SecureStore from 'expo-secure-store';

/**
 * User-level runtime state — persona, voice engine flags, and high-level
 * conversation state. The active persona persists to encrypted storage and
 * rehydrates at boot (STEP 5 wiring).
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

const PERSONA_KEY = 'cthos.persona.v1';

const VALID_PERSONAS: PersonaId[] = ['GF', 'Professional', 'Venom'];

/** Restore the last-used persona once at boot; safe to call repeatedly. */
let personaHydrationStarted = false;
export async function hydratePersona(): Promise<void> {
  if (personaHydrationStarted) return;
  personaHydrationStarted = true;
  try {
    const saved = await SecureStore.getItemAsync(PERSONA_KEY);
    if (saved && VALID_PERSONAS.includes(saved as PersonaId)) {
      personalityManager.setPersona(saved as PersonaId);
      useUserStore.setState({ persona: saved as PersonaId });
    }
  } catch (e) {
    console.warn('[Cthos:user] failed to load persona', e);
  }
}

export const useUserStore = create<UserState>((set) => ({
  persona: personalityManager.current,
  voiceReady: false,
  micActive: false,
  currentLanguage: 'en',
  setPersona: (p) => {
    personalityManager.setPersona(p);
    void SecureStore.setItemAsync(PERSONA_KEY, p).catch((e) =>
      console.warn('[Cthos:user] failed to save persona', e),
    );
    set({ persona: p });
  },
  setVoiceReady: (v) => set({ voiceReady: v }),
  setMicActive: (v) => set({ micActive: v }),
  setLanguage: (l) => set({ currentLanguage: l }),
}));
