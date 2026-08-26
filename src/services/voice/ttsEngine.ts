/**
 * TtsEngine — text-to-speech over expo-speech, tuned per persona + language.
 *
 * The engine resolves concrete speech options (language, pitch, rate, voice)
 * from the PersonalityManager and speaks text with reliable stop/interrupt
 * semantics so the voice session can barge-in (mid-sentence interruption).
 */
import * as Speech from 'expo-speech';
import { Language } from '../types';
import { personalityManager } from '../ai/personalityManager';

export class TtsEngine {
  private speaking = false;

  constructor() {
    void Speech.maxSpeechInputLength; // forces module import at lifecycle start
  }

  /**
   * Speak a reply in the current persona's voice. Calling while already
   * speaking cancels the previous utterance (barge-in support).
   */
  async speak(text: string, language: Language = 'en') {
    const opts = personalityManager.speechOptions(language);
    await this.cancel(); // ensure a single active utterance
    this.speaking = true;
    Speech.speak(text, {
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
    });
  }

  /** Interrupt current speech and clear the queue. */
  async cancel() {
    if (this.speaking) {
      await Speech.stop();
    }
    this.speaking = false;
  }

  async stop() {
    await this.cancel();
  }

  isSpeaking() {
    return this.speaking;
  }
}

export const ttsEngine = new TtsEngine();