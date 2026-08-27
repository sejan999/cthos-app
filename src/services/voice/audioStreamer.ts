/**
 * VoiceSession — the real-time, full-duplex speech-to-speech engine.
 *
 * Composes STT + TTS + the Agent/Personality/Tone engines into a continuous
 * conversational loop:
 *   listen -> interim/final transcript
 *   final  -> interrupt any active TTS (barge-in), parse intent
 *          -> persona switch OR capability ack OR chat reply
 *          -> shape reply via persona + tone
 *          -> speak reply through the persona voice
 *
 * Supports English + Hindi and mid-sentence voice interruption: if the user
 * starts speaking while Cthos is voicing a reply, we cancel the utterance and
 * capture the new input.
 */
import { VoiceEngine, VoiceEngineEvents, Language, Utterance, ToneProfile, PersonaId } from '../types';
import { sttEngine } from './sttEngine';
import { ttsEngine } from './ttsEngine';
import { languageManager } from './languageManager';
import { personalityManager } from '../ai/personalityManager';
import { agentOrchestrator, AgentAction } from '../ai/agentOrchestrator';

/** Where an assistant reply ultimately comes from (registered by UI/STEP 4). */
export type ReplyProvider = (utterance: Utterance) => Promise<string>;

const INTERRUPT_BARGE_IN_MS = 700;

export class VoiceSession implements VoiceEngine {
  private listeners: VoiceEngineEvents = {};
  private replyProvider: ReplyProvider | null = null;
  private lastInterruptAt = 0;
  private runningQueue: Promise<void> = Promise.resolve();

  constructor() {
    sttEngine.setHandlers({
      onInterim: (u) => {
        if (ttsEngine.isSpeaking()) void this.handleInterruption();
        this.listeners.onInterim?.(u);
      },
      onFinal: (u) => {
        if (ttsEngine.isSpeaking()) void this.handleInterruption();
        this.listeners.onFinal?.(u);
        this.enqueue(() => this.processUtterance(u));
      },
      onStateChange: (e) => this.listeners.onStateChange?.(e),
      onVolume: () => {},
    });
  }

  /** Register a provider that generates the assistant reply for a final input. */
  setReplyProvider(provider: ReplyProvider) {
    this.replyProvider = provider;
  }

  on(events: VoiceEngineEvents) {
    this.listeners = { ...this.listeners, ...events };
  }

  setPersona(id: PersonaId) {
    personalityManager.setPersona(id);
  }

  async start(): Promise<void> {
    try {
      this.listeners.onStateChange?.('listening');
      await sttEngine.start(languageManager.current);
    } catch (e) {
      console.warn('[Cthos:Voice] start failed', e);
      this.listeners.onStateChange?.('silence');
    }
  }

  async stop(): Promise<void> {
    try {
      await ttsEngine.cancel();
      await sttEngine.stop();
      this.listeners.onStateChange?.('silence');
    } catch (e) {
      console.warn('[Cthos:Voice] stop failed', e);
      this.listeners.onStateChange?.('silence');
    }
  }

  switchLanguage(lang: Language): void {
    languageManager.current = lang;
    // sttEngine.start is hardened and never rejects.
    if (sttEngine.isActive()) void sttEngine.start(lang);
  }

  /** Barge-in: silence the assistant immediately when the user speaks. */
  private async handleInterruption(): Promise<void> {
    if (Date.now() - this.lastInterruptAt < INTERRUPT_BARGE_IN_MS) return;
    this.lastInterruptAt = Date.now();
    this.listeners.onStateChange?.('interruption');
    await ttsEngine.cancel();
  }

  /**
   * Serialize turns so replies never overlap.
   *
   * IMPORTANT: the chain is caught before each `.then(task)` — without that,
   * a single rejection would poison the queue and silently drop EVERY future
   * turn (observed as "assistant stops responding" after one glitch).
   */
  private enqueue(task: () => Promise<void>) {
    this.runningQueue = this.runningQueue
      .catch(() => {
        /* previous turn's failure must not sink the queue */
      })
      .then(task)
      .catch((e) => console.warn('[Cthos:Voice] turn failed', e));
  }

  private async processUtterance(u: Utterance): Promise<void> {
    const text = typeof u?.text === 'string' ? u.text.trim() : '';
    if (!text) return;
    this.listeners.onStateChange?.('thinking');

    try {
      const intent = agentOrchestrator.classify(text, languageManager.current);
      const lang = languageManager.detect(text);

      if (intent.action === 'persona_switch' && intent.requestedPersona) {
        try {
          personalityManager.setPersona(intent.requestedPersona);
        } catch (e) {
          console.warn('[Cthos:Voice] persona switch failed', e);
        }
        const confirm = this.defaultResponder(intent.action);
        await this.speakReply(confirm, lang, intent.tone, true);
        return;
      }

      // The reply provider (command router -> Gemini) runs inside its own
      // guard: a network failure or a parsing bug must fall back to a spoken
      // message instead of leaving an unhandled rejection on the turn queue.
      let reply: string;
      try {
        reply = this.replyProvider
          ? await this.replyProvider({ ...u, text })
          : this.defaultResponder(intent.action);
      } catch (e) {
        console.warn('[Cthos:Voice] reply provider failed', e);
        reply = 'I had trouble reaching my brain just now. Try again in a moment.';
      }
      await this.speakReply(reply, lang, intent.tone, true);
    } catch (e) {
      // Absolute last line of defence for the conversation thread.
      console.warn('[Cthos:Voice] utterance processing failed', e);
      this.listeners.onStateChange?.('silence');
    }
  }

  private defaultResponder(action: AgentAction): string {
    const map: Record<string, string> = {
      music: 'Opening the music engine.',
      automation: 'Handling that for you.',
      whatsapp: 'Working on your message now.',
      macro: 'Checking your routines.',
      vision: 'Looking at your screen now.',
      persona_switch: 'Persona switched.',
      chat: 'Go on, I’m listening.',
      unknown: 'I didn’t quite catch that.',
    };
    return map[action] ?? 'Got it.';
  }

  private async speakReply(text: string, lang: Language, tone: ToneProfile, voiced: boolean) {
    let shaped = text;
    try {
      shaped = personalityManager.shapeReply(text, tone);
    } catch (e) {
      console.warn('[Cthos:Voice] reply shaping failed — using raw text', e);
    }
    if (!voiced) {
      this.listeners.onReplyDone?.(shaped);
      return;
    }
    this.listeners.onStateChange?.('speaking');
    try {
      await ttsEngine.speak(shaped, lang); // never rejects (hardened TTS)
    } catch (e) {
      console.warn('[Cthos:Voice] tts speak failed', e);
    }
    this.listeners.onStateChange?.('silence');
    this.safeNotifyReplyDone(shaped);
  }

  /** Listener callbacks run arbitrary UI code — they must never throw here. */
  private safeNotifyReplyDone(reply: string) {
    try {
      this.listeners.onReplyDone?.(reply);
    } catch (e) {
      console.warn('[Cthos:Voice] onReplyDone listener failed', e);
    }
  }

  isActive() {
    return sttEngine.isActive();
  }
}

/** Shared engine instance used by the UI (MicButton), orchestrators & STEP 4. */
export const audioStreamer = new VoiceSession();
export const voiceSession = audioStreamer;