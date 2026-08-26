/**
 * Personality Engine — persona selection, emotional tone adaptation, and
 * per-persona TTS speech options (language / pitch / rate / volume / voice).
 *
 * Supports real-time switching across GF / Professional / Venom and feeds the
 * voice engine a concrete speech profile plus a response-shaping layer so each
 * persona sounds distinct while reflecting the user's detected mood.
 */
import { PersonaId, Language, ToneProfile, TtsSpeechOptions } from '../types';

export interface PersonaProfile {
  id: PersonaId;
  label: string;
  systemPrompt: string;
  /** TTS tuning — distinct timbre per persona (rate/pitch/volume/voice). */
  speech: Omit<TtsSpeechOptions, 'language'>;
  greeting: Record<Language, string>;
}

const GF_GREETINGS: Record<Language, string> = {
  en: 'Hey love, I’m here.',
  hi: 'हाँ, मैं यहाँ हूँ।',
};
const PRO_GREETINGS: Record<Language, string> = {
  en: 'Ready when you are.',
  hi: 'प्रस्तुत हूँ।',
};
const VENOM_GREETINGS: Record<Language, string> = {
  en: 'Let’s make it happen. No drama.',
  hi: 'हाँ, ज़्यादा बात नहीं।',
};

export const PERSONAS: Record<PersonaId, PersonaProfile> = {
  GF: {
    id: 'GF',
    label: 'GF Mode',
    systemPrompt:
      'You are Cthos in GF Mode: warm, caring, supportive, playful. Speak naturally and personally, use casual warmth, never robotic.',
    speech: { voice: undefined, pitch: 1.15, rate: 0.9, volume: 1 },
    greeting: GF_GREETINGS,
  },
  Professional: {
    id: 'Professional',
    label: 'Professional',
    systemPrompt:
      'You are Cthos in Professional Mode: concise, executive, highly structured. Lead with the answer, then cite rationale.',
    speech: { voice: undefined, pitch: 0.95, rate: 1.0, volume: 0.95 },
    greeting: PRO_GREETINGS,
  },
  Venom: {
    id: 'Venom',
    label: 'Venom',
    systemPrompt:
      'You are Cthos in Venom Mode: edgy, bold, witty, sharp-tongued. Confident, teasing, but always useful and safe.',
    speech: { voice: undefined, pitch: 0.8, rate: 1.08, volume: 1 },
    greeting: VENOM_GREETINGS,
  },
};

export class PersonalityManager {
  current: PersonaId = 'Professional';

  setPersona(id: PersonaId) {
    this.current = id;
  }

  profile(): PersonaProfile {
    return PERSONAS[this.current];
  }

  greeting(language: Language = 'en'): string {
    return PERSONAS[this.current].greeting[language];
  }

  /** Resolve expo-speech options for the active persona + language. */
  speechOptions(language: Language): TtsSpeechOptions {
    const p = PERSONAS[this.current];
    return {
      language: language === 'hi' ? 'hi-IN' : 'en-US',
      ...p.speech,
    };
  }

  /**
   * Shape an assistant draft reply through the persona's voice + the user's
   * detected mood. LLM grounding + deeper tone injection lands in STEP 5.
   */
  shapeReply(text: string, tone: ToneProfile): string {
    let out = text.trim();
    switch (this.current) {
      case 'GF':
        if (tone.tone === 'sad' || tone.tone === 'anxious') out = `I’m right here with you. ${out}`;
        else if (tone.tone === 'happy') out = `Love that! ${out}`;
        break;
      case 'Venom':
        if (tone.tone === 'urgent') out = `On it — don’t blink. ${out}`;
        else if (tone.tone === 'sad') out = `Chin up, alright? ${out}`;
        break;
      case 'Professional':
        if (tone.tone === 'formal') out = `Certainly. ${out}`;
        break;
    }
    if (/[.!?]$/.test(out) === false) out += '.';
    return out;
  }
}

export const personalityManager = new PersonalityManager();