/**
 * TtsEngine — text-to-speech over expo-speech, tuned per persona + language.
 *
 * HARDENED (STEP 5 stability pass):
 *   - Every native call is individually guarded. Budget/OEM Android devices
 *     frequently ship broken or missing TTS engines; `Speech.stop()` in
 *     particular rejects on many of them. Cthos must never crash or
 *     "auto-back" because the device can't speak.
 *   - Input is coerced and truncated to maxSpeechInputLength so oversized
 *     model replies cannot throw inside the native bridge.
 */
import * as Speech from 'expo-speech';
import { Language } from '../types';
import { personalityManager } from '../ai/personalityManager';

export class TtsEngine {
  private speaking = false;
  /** False when the native speech module is unavailable (Expo Go edge cases). */
  private moduleAvailable = true;

  constructor() {
    try {
      void Speech.maxSpeechInputLength; // forces module import at lifecycle start
      this.moduleAvailable =
        typeof Speech.speak === 'function' && typeof Speech.stop === 'function';
    } catch (e) {
      console.warn('[Cthos:TTS] speech module unavailable', e);
      this.moduleAvailable = false;
    }
  }

  /**
   * Speak a reply in the current persona's voice. Calling while already
   * speaking cancels the previous utterance (barge-in support). Never rejects.
   */
  async speak(text: string, language: Language = 'en'): Promise<void> {
    if (!this.moduleAvailable) return;
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!clean) return;

    // OEM TTS engines choke on very long strings — clamp to the safe limit.
    let payload = clean;
    try {
      const max = Speech.maxSpeechInputLength ?? 4000;
      if (payload.length > max) {
        payload = `${payload.slice(0, Math.max(0, max - 40))}…`;
        // Trim to a sentence boundary so we don't cut mid-word where possible.
        const lastStop = Math.max(
          payload.lastIndexOf('. '),
          payload.lastIndexOf('! '),
          payload.lastIndexOf('? '),
          payload.lastIndexOf('\n'),
        );
        if (lastStop > max / 2) payload = payload.slice(0, lastStop + 1);
      }
    } catch {
      /* limit lookup failed — proceed with full text */
    }

    await this.cancel(); // ensure a single active utterance

    let opts: Record<string, unknown> = {};
    try {
      const resolved = personalityManager.speechOptions(language);
      opts = { ...(resolved as Record<string, unknown>) };
    } catch (e) {
      console.warn('[Cthos:TTS] persona options failed, using defaults', e);
    }

    this.speaking = true;
    try {
      Speech.speak(payload, {
        ...opts,
        onDone: () => {
          this.speaking = false;
        },
        onStopped: () => {
          this.speaking = false;
        },
        onError: () => {
          this.speaking = false;
        },
      } as Parameters<typeof Speech.speak>[1]);
    } catch (e) {
      console.warn('[Cthos:TTS] speak failed', e);
      this.speaking = false;
    }
  }

  /** Interrupt current speech and clear the queue. Never rejects. */
  async cancel(): Promise<void> {
    if (this.speaking && this.moduleAvailable) {
      try {
        await Speech.stop();
      } catch (e) {
        console.warn('[Cthos:TTS] stop failed', e);
      }
    }
    this.speaking = false;
  }

  async stop(): Promise<void> {
    await this.cancel();
  }

  isSpeaking() {
    return this.speaking && this.moduleAvailable;
  }
}

export const ttsEngine = new TtsEngine();
