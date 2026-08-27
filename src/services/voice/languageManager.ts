/**
 * LanguageManager — English / Hindi handling for the voice engine.
 *
 * Maps our internal `Language` ('en' | 'hi') to everything the underlying
 * platforms need: STT BCP-47 locale, TTS locale, and a human-friendly label.
 * Also provides heuristic language detection (Devanagari) to auto-follow the
 * user's spoken language.
 */
import { Language } from '../types';

const LOCALES: Record<Language, string> = {
  en: 'en-US',
  hi: 'hi-IN',
};

const LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
};

/** Devanagari block range used to detect Hindi/Indic speech. */
const DEVANAGARI_RE = /[\u0900-\u097F]/;

export class LanguageManager {
  current: Language = 'en';

  setLanguage(lang: Language) {
    this.current = lang;
  }

  toggle() {
    this.current = this.current === 'en' ? 'hi' : 'en';
    return this.current;
  }

  get locale() {
    return LOCALES[this.current];
  }

  label(lang: Language = this.current) {
    return LABELS[lang];
  }

  /**
   * Heuristically detect whether a transcript is Hindi (presence of
   * Devanagari or common Hinglish markers).
   */
  detect(text: string): Language {
    if (!text) return 'en';
    if (DEVANAGARI_RE.test(String(text))) return 'hi';
    const lo = String(text).toLowerCase();
    if (/(hai|ho|kya|kaise|thik hai|nahi|haan|matlab|wala|wale)\b/.test(lo)) {
      return 'hi';
    }
    return 'en';
  }

  /** BCP-47 locale for a given language (STT + TTS both accept these). */
  localeFor(lang: Language = this.current) {
    return LOCALES[lang];
  }
}

export const languageManager = new LanguageManager();