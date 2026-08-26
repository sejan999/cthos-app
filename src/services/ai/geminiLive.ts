/**
 * Gemini Live Brain — the real-time, dynamic AI engine behind the voice loop.
 *
 * Composes the on-device AI stack into one contract:
 *   - The API key lives in AiKeyStore (expo-secure-store, "AQ" key prefix).
 *   - The active persona's system prompt grounds every reply.
 *   - Recency + the orchestrator's tone routing contextualise each turn.
 *   - Replies stream back as plain text and feed TTS (via the ReplyProvider
 *     that VoiceSession expects) for speech-to-speech conversation.
 *
 * The provider returned by {@link GeminiLiveSession.makeReplyProvider}
 * satisfies the {@link ReplyProvider} signature expected by VoiceSession so
 * Cthos produces real, persona-aware model replies rather than canned
 * fallbacks.
 */
import { GoogleGenAI } from '@google/genai';
import { Utterance, PersonaId, ToneProfile } from '../types';
import { apiKeyStore, getApiKeySource } from './aiKeyStore';
import { PERSONAS } from './personalityManager';
import { personalityManager } from './personalityManager';
import { toneEngine } from './toneEngine';

export type GeminiProviderStatus = 'disconnected' | 'no-key' | 'ready' | 'error';

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiLiveConfig {
  /** Gemini model id. Defaults to the fast, multimodal flash model. */
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ReplyProvider {
  (utterance: Utterance): Promise<string>;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const TONE_HINT: Record<string, string> = {
  happy: 'Keep the energy warm and upbeat.',
  sad: 'Be gentle, reassuring and supportive.',
  anxious: 'Stay calm, concrete and grounding.',
  urgent: 'Be fast and action-first; keep it short.',
  joking: 'Stay playful and light with a hint of wit.',
  formal: 'Keep it respectful and structured.',
};

const DEFAULT_FALLBACK =
  '(I need a Gemini API key to answer that — add one in Settings > Cloud & API keys.)';

export class GeminiLiveSession {
  private statusValue: GeminiProviderStatus = 'no-key';
  private readonly config: Required<GeminiLiveConfig>;

  constructor(config: GeminiLiveConfig = {}) {
    this.config = {
      model: config.model ?? DEFAULT_GEMINI_MODEL,
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 1024,
    };
  }

  /** Where the active key lives (for the Settings/UI). */
  async source(): Promise<'secure' | 'env' | 'missing'> {
    return getApiKeySource();
  }

  status(): GeminiProviderStatus {
    return this.statusValue;
  }

  /** True when a validated key is present so we can actually reply. */
  async ready(): Promise<boolean> {
    return (await apiKeyStore.get()) !== null;
  }

  /** Build a fresh client against whatever key is currently stored. */
  private async buildClient(): Promise<GoogleGenAI | null> {
    const key = await apiKeyStore.get();
    if (!key) {
      this.statusValue = 'no-key';
      return null;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      this.statusValue = 'ready';
      return ai;
    } catch (e) {
      console.warn('[Cthos:Gemini] init failed', e);
      this.statusValue = 'error';
      return null;
    }
  }

  /** Compose the persona + tone + language system prompt for a reply. */
  private buildSystemPrompt(personaPrompt: string, tone: ToneProfile, lang: Utterance['language']): string {
    const languageInstruction =
      lang === 'hi' ? 'Reply primarily in Hinglish/Hindi.' : 'Reply primarily in English.';
    const toneHint = TONE_HINT[tone.tone] ?? 'Stay natural and conversational.';
    return [
      personaPrompt,
      languageInstruction,
      `Current mood is "${tone.tone}". ${toneHint}`,
      'Keep replies concise and natural for voice (1–3 short sentences).',
    ].join('\n');
  }

  /**
   * Generate a personality-aware reply for a final utterance.
   * Returns plain text suitable for the persona's TTS voice.
   */
  async generateReply(input: {
    utterance: Utterance;
    persona: PersonaId;
    tone?: ToneProfile;
    history?: GeminiTurn[];
  }): Promise<string> {
    const ai = await this.buildClient();
    if (!ai) return DEFAULT_FALLBACK;

    const persona = PERSONAS[input.persona];
    const tone = input.tone ?? toneEngine.detect(input.utterance.text);
    const lang = input.utterance.language;
    const systemInstruction = this.buildSystemPrompt(persona.systemPrompt, tone, lang);

    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const h of (input.history ?? []).slice(-8)) {
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    }
    contents.push({ role: 'user', parts: [{ text: input.utterance.text }] });

    try {
      const resp = await ai.models.generateContent({
        model: this.config.model,
        contents,
        config: {
          systemInstruction,
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
        },
      });
      this.statusValue = 'ready';
      const text = (resp.text ?? '').trim();
      return text || DEFAULT_FALLBACK;
    } catch (e) {
      console.warn('[Cthos:Gemini] generate failed', e);
      this.statusValue = 'error';
      return DEFAULT_FALLBACK;
    }
  }

  /** Wrap this session as a VoiceEngine ReplyProvider for VoiceSession. */
  makeReplyProvider(): ReplyProvider {
    return (utterance: Utterance) =>
      this.generateReply({
        utterance,
        persona: personalityManager.current,
        tone: toneEngine.detect(utterance.text),
      });
  }
}

/** Shared, app-wide Gemini brain instance. */
export const geminiLive = new GeminiLiveSession();

/** Convenience singleton provider bound to the shared brain + current persona. */
export const geminiReplyProvider: ReplyProvider = geminiLive.makeReplyProvider();
