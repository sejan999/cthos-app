/**
 * SttEngine — speech-to-text abstraction over expo-speech-recognition.
 *
 * Provides English + Hindi recognition (via LanguageManager locales),
 * interim + final result streaming, and volume/end-of-speech detection hooks
 * used for mid-sentence interruption in the voice session.
 */
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Utterance, Language, VoiceActivityEvent } from '../types';

export interface SttEventHandlers {
  onInterim: (u: Utterance) => void;
  onFinal: (u: Utterance) => void;
  onStateChange: (e: VoiceActivityEvent) => void;
  /** Reported loudness 0..1 from the recognizer, if supported. */
  onVolume?: (level: number) => void;
}

export class SttEngine {
  private handlers: SttEventHandlers = {
    onInterim: () => {},
    onFinal: () => {},
    onStateChange: () => {},
  };
  private recognising = false;
  private language: Language = 'en';

  constructor() {
    // NOTE: This module registers native event listeners. Because React Native
    // hooks cannot live here, we subscribe to the module-level event emitter
    // directly (idempotent across app lifetime).
    ExpoSpeechRecognitionModule.addSpeechRecognitionListener('result', (event) => {
      if (!this.recognising) return;
      const text = (event as SpeechRecognitionResultDetail).transcript ?? '';
      const isFinal = (event as SpeechRecognitionResultDetail).isFinal ?? false;
      const u: Utterance = {
        text,
        language: this.language,
        confidence: (event as SpeechRecognitionResultDetail).confidence ?? 1,
        timestamp: Date.now(),
      };
      if (isFinal) {
        this.handlers.onFinal(u);
      } else {
        this.handlers.onInterim(u);
      }
    });

    ExpoSpeechRecognitionModule.addSpeechRecognitionListener('start', () => {
      this.handlers.onStateChange('listening');
    });
    ExpoSpeechRecognitionModule.addSpeechRecognitionListener('end', () => {
      this.recognising = false;
      this.handlers.onStateChange('silence');
    });
    ExpoSpeechRecognitionModule.addSpeechRecognitionListener('error', (err) => {
      console.warn('[Cthos:STT]', err);
      this.recognising = false;
      this.handlers.onStateChange('silence');
    });
  }

  setHandlers(h: SttEventHandlers) {
    this.handlers = h;
  }

  async requestPermissions() {
    const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return res.granted !== false;
  }

  async start(language: Language) {
    this.language = language;
    const granted = await this.requestPermissions();
    if (!granted) {
      this.handlers.onStateChange('silence');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: language === 'hi' ? 'hi-IN' : 'en-US',
      interimResults: true,
      continuous: true,
      volume: true,
    });
    this.recognising = true;
  }

  async stop() {
    if (!this.recognising) return;
    ExpoSpeechRecognitionModule.stop();
    this.recognising = false;
  }

  async abort() {
    ExpoSpeechRecognitionModule.abort();
    this.recognising = false;
  }

  isActive() {
    return this.recognising;
  }
}

interface SpeechRecognitionResultDetail {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export const sttEngine = new SttEngine();