/**
 * SttEngine — speech-to-text abstraction over expo-speech-recognition.
 *
 * Provides English + Hindi recognition (via LanguageManager locales),
 * interim + final result streaming, and volume/end-of-speech detection hooks
 * used for mid-sentence interruption in the voice session.
 *
 * HARDENED (STEP 5 stability pass):
 *   - The singleton is constructed at module scope through the audioStreamer
 *     import chain. If the native recognition module is missing or the event
 *     emitter throws (older devices, Expo Go drift), construction degrades to
 *     a silent no-op engine instead of red-screening the whole app.
 *   - start()/stop()/abort() never reject; every call is guarded so a race
 *     between mic toggle and a native error can't produce an unhandled
 *     rejection (a classic Android "auto-back" trigger).
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

interface ResultDetail {
  transcript?: string;
  isFinal?: boolean;
  confidence?: number;
}

type AddListener = (event: string, cb: (payload: unknown) => void) => unknown;

/** Safely probe for the native module at runtime (no import-time throw). */
function probeNativeModule(): ExpoSpeechRecognitionModule | null {
  try {
    const mod = ExpoSpeechRecognitionModule as unknown as {
      addSpeechRecognitionListener?: AddListener;
    } | null;
    if (
      mod &&
      typeof mod.addSpeechRecognitionListener === 'function' &&
      typeof mod.start === 'function' &&
      typeof mod.stop === 'function'
    ) {
      return ExpoSpeechRecognitionModule;
    }
    return null;
  } catch (e) {
    console.warn('[Cthos:STT] native module unavailable', e);
    return null;
  }
}

export class SttEngine {
  private handlers: SttEventHandlers = {
    onInterim: () => {},
    onFinal: () => {},
    onStateChange: () => {},
  };
  private recognising = false;
  private language: Language = 'en';
  private native: ExpoSpeechRecognitionModule | null = null;

  constructor() {
    const mod = probeNativeModule();
    if (!mod) return; // degrade gracefully — mic toggles become no-ops
    this.native = mod;
    this.registerListeners(mod);
  }

  private registerListeners(mod: ExpoSpeechRecognitionModule): void {
    try {
      const add = (mod.addSpeechRecognitionListener as unknown) as AddListener;
      // Each listener body is exception-proofed: a bad event payload must
      // never surface as a thrown error into React state.
      add('result', (raw) => {
        try {
          if (!this.recognising) return;
          const event = (raw ?? {}) as ResultDetail;
          const text =
            typeof event.transcript === 'string' ? event.transcript : '';
          if (!text) return;
          const u: Utterance = {
            text,
            language: this.language,
            confidence:
              typeof event.confidence === 'number' ? event.confidence : 1,
            timestamp: Date.now(),
          };
          if (event.isFinal === true) this.handlers.onFinal(u);
          else this.handlers.onInterim(u);
        } catch (e) {
          console.warn('[Cthos:STT] result handler failed', e);
        }
      });

      add('start', () => {
        try {
          this.handlers.onStateChange('listening');
        } catch (e) {
          console.warn('[Cthos:STT] start handler failed', e);
        }
      });
      add('end', () => {
        try {
          this.recognising = false;
          this.handlers.onStateChange('silence');
        } catch (e) {
          console.warn('[Cthos:STT] end handler failed', e);
        }
      });
      add('error', (err) => {
        console.warn('[Cthos:STT]', err);
        this.recognising = false;
        try {
          this.handlers.onStateChange('silence');
        } catch (e) {
          console.warn('[Cthos:STT] error handler failed', e);
        }
      });
    } catch (e) {
      console.warn('[Cthos:STT] listener registration failed', e);
      this.native = null; // module exists but emitter is broken → no-op mode
    }
  }

  setHandlers(h: SttEventHandlers) {
    // Defensive copy with fallbacks so a partial handler object can't wipe
    // an existing callback and turn a later event into a crash.
    this.handlers = {
      onInterim: h.onInterim ?? ((u) => this.handlers.onInterim(u)),
      onFinal: h.onFinal ?? ((u) => this.handlers.onFinal(u)),
      onStateChange:
        h.onStateChange ?? ((e) => this.handlers.onStateChange(e)),
      ...(h.onVolume ? { onVolume: h.onVolume } : {}),
    };
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.native) return false;
    try {
      const res = await (
        this.native as unknown as {
          requestPermissionsAsync: () => Promise<{ granted?: boolean } | null>;
        }
      ).requestPermissionsAsync();
      return res != null && res.granted !== false;
    } catch (e) {
      console.warn('[Cthos:STT] permission request failed', e);
      return false;
    }
  }

  async start(language: Language): Promise<void> {
    this.language = language;
    if (!this.native) return;
    const granted = await this.requestPermissions();
    if (!granted) {
      try {
        this.handlers.onStateChange('silence');
      } catch {
        /* handler errors are never fatal */
      }
      return;
    }
    try {
      await Promise.resolve(
        (
          this.native as unknown as {
            start: (opts: Record<string, unknown>) => unknown;
          }
        ).start({
          lang: language === 'hi' ? 'hi-IN' : 'en-US',
          interimResults: true,
          continuous: true,
          volume: true,
        }),
      );
      this.recognising = true;
    } catch (e) {
      console.warn('[Cthos:STT] start failed', e);
      this.recognising = false;
      this.handlers.onStateChange('silence');
    }
  }

  async stop(): Promise<void> {
    if (!this.native || !this.recognising) return;
    this.recognising = false;
    try {
      await Promise.resolve(
        (this.native as unknown as { stop: () => unknown }).stop(),
      );
    } catch (e) {
      console.warn('[Cthos:STT] stop failed', e);
    }
  }

  async abort(): Promise<void> {
    if (!this.native) return;
    this.recognising = false;
    try {
      await Promise.resolve(
        (this.native as unknown as { abort: () => unknown }).abort(),
      );
    } catch (e) {
      console.warn('[Cthos:STT] abort failed', e);
    }
  }

  isAvailable(): boolean {
    return this.native !== null;
  }

  isActive() {
    return this.recognising;
  }
}

export const sttEngine = new SttEngine();
