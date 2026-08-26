/**
 * Realtime audio stream abstraction — planned low-latency, full-duplex input
 * capture with interruption detection. STEP 3 implements the native/Expo glue;
 * here we define the contract + a mock for development tones.
 */
import { VoiceEngine, VoiceEngineEvents, Language } from '../types';

export class AudioStreamer implements VoiceEngine {
  private listeners: VoiceEngineEvents = {};
  private capturing = false;

  constructor(private events: VoiceEngineEvents = {}) {
    this.listeners = events;
  }

  on(events: VoiceEngineEvents) {
    this.listeners = { ...this.listeners, ...events };
  }

  async start(): Promise<void> {
    this.capturing = true;
    this.listeners.onStateChange?.('speaking');
  }

  async stop(): Promise<void> {
    this.capturing = false;
    this.listeners.onStateChange?.('silence');
  }

  switchLanguage(lang: Language): void {
    void lang; // STT config swap in STEP 3.
  }

  get isCapturing() {
    return this.capturing;
  }
}