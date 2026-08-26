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
    this.listeners.onStateChange?.('listening');
    await sttEngine.start(languageManager.current);
  }

  async stop(): Promise<void> {
    await ttsEngine.cancel();
    await sttEngine.stop();
    this.listeners.onStateChange?.('silence');
  }

  switchLanguage(lang: Language): void {
    languageManager.current = lang;
    if (sttEngine.isActive()) void sttEngine.start(lang);
  }

  /** Barge-in: silence the assistant immediately when the user speaks. */
  private async handleInterruption(): Promise<void> {
    if (Date.now() - this.lastInterruptAt < INTERRUPT_BARGE_IN_MS) return;
    this.lastInterruptAt = Date.now();
    this.listeners.onStateChange?.('interruption');
    await ttsEngine.cancel();
  }

  /** Serialize turns so replies never overlap. */
  private enqueue(task: () => Promise<void>) {
    this.runningQueue = this.runningQueue.then(task);
  }

  private async processUtterance(u: Utterance): Promise<void> {
    const text = u.text.trim();
    if (!text) return;
    this.listeners.onStateChange?.('thinking');

    const intent = agentOrchestrator.classify(text, languageManager.current);
    const lang = languageManager.detect(text);

    if (intent.action === 'persona_switch' && intent.requestedPersona) {
      personalityManager.setPersona(intent.requestedPersona);
      const confirm = this.defaultResponder(intent.action);
      await this.speakReply(confirm, lang, intent.tone, true);
      return;
    }

    const reply = this.replyProvider
      ? await this.replyProvider(u)
      : this.defaultResponder(intent.action);
    await this.speakReply(reply, lang, intent.tone, true);
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
    const shaped = personalityManager.shapeReply(text, tone);
    if (!voiced) {
      this.listeners.onReplyDone?.(shaped);
      return;
    }
    this.listeners.onStateChange?.('speaking');
    await ttsEngine.speak(shaped, lang);
    this.listeners.onStateChange?.('silence');
    this.listeners.onReplyDone?.(shaped);
  }

  isActive() {
    return sttEngine.isActive();
  }
}

/** Shared engine instance used by the UI (MicButton), orchestrators & STEP 4. */
export const audioStreamer = new VoiceSession();
export const voiceSession = audioStreamer;