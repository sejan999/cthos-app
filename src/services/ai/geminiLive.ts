/**
 * Gemini Live Brain — the real-time AI engine behind voice + text.
 *
 * DEEP-FIX (this rewrite repairs "Gemini does nothing"):
 *   1. RN-CORRECT SDK ENTRY — the old file imported `@google/genai` bare. Under
 *      Metro that resolves to the CROSS-platform bundle whose fetch/WebSocket
 *      factories throw crossError() on React Native, so every call failed
 *      before reaching Google. We now import from '@google/genai/web', whose
 *      client uses the global fetch()/WebSocket that both Hermes and JSC
 *      provide — this fixes TEXT generation AND unlocks ai.live (WebSocket).
 *   2. KEY ACCEPTANCE — real keys are "AIza…" (see aiKeyStore); nothing is
 *      rejected at the brain layer any more.
 *   3. CONVERSATION MEMORY — the session keeps the last 8 exchanges and sends
 *      them with every request, so follow-ups ("what about tomorrow?") work.
 *   4. NO MORE SILENT FAILURES — errors are logged, surfaced to the user via a
 *      rate-limited native Alert (max once per 30 s), and the per-turn error
 *      detail is returned for the UI instead of an opaque fallback string.
 */
import { GoogleGenAI } from '@google/genai/web';
import { Alert } from 'react-native';
import { Utterance, PersonaId, ToneProfile } from '../types';
import { apiKeyStore } from './aiKeyStore';
import { PERSONAS } from './personalityManager';
import { personalityManager } from './personalityManager';
import { toneEngine } from './toneEngine';

export type GeminiProviderStatus = 'disconnected' | 'no-key' | 'ready' | 'error';

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiLiveConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Per-request timeout in ms (network stalls must not wedge the loop). */
  timeoutMs?: number;
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

const NO_KEY_FALLBACK =
  'I need a Gemini API key to answer that — add one in Settings under Gemini API Key.';

/** Rate-limit native alerts so a long outage can't spam the user. */
let lastAlertAt = 0;
function alertFailureOnce(detail: string): void {
  const now = Date.now();
  if (now - lastAlertAt < 30_000) return;
  lastAlertAt = now;
  try {
    Alert.alert('Cthos brain error', detail);
  } catch (e) {
    console.warn('[Cthos:Gemini] alert failed', e);
  }
}

function describeError(e: unknown): string {
  if (e instanceof Error) return e.message || e.name;
  return String(e ?? 'unknown error');
}

export class GeminiLiveSession {
  private statusValue: GeminiProviderStatus = 'no-key';
  private readonly config: Required<GeminiLiveConfig>;
  /** Client cached per API key — rebuilt only when the stored key changes. */
  private client: GoogleGenAI | null = null;
  private clientKey: string | null = null;
  /** Rolling conversation memory (in-session). */
  private history: GeminiTurn[] = [];

  constructor(config: GeminiLiveConfig = {}) {
    this.config = {
      model: config.model ?? DEFAULT_GEMINI_MODEL,
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 1024,
      timeoutMs: config.timeoutMs ?? 20_000,
    };
  }

  status(): GeminiProviderStatus {
    return this.statusValue;
  }

  async ready(): Promise<boolean> {
    return (await apiKeyStore.get()) !== null;
  }

  /** Forget conversation context (persona switch / privacy wipe). */
  resetMemory(): void {
    this.history = [];
  }

  /** Build (or reuse) a client for the currently stored key. */
  private async getClient(): Promise<GoogleGenAI | null> {
    const key = await apiKeyStore.get();
    if (!key) {
      this.statusValue = 'no-key';
      return null;
    }
    if (this.client && this.clientKey === key) return this.client;
    try {
      // '@google/genai/web' client: uses RN's global fetch + WebSocket.
      // httpOptions.timeout bounds each HTTP attempt so a stalled network
      // can never wedge the voice loop.
      this.client = new GoogleGenAI({
        apiKey: key,
        httpOptions: { timeout: this.config.timeoutMs },
      });

      this.clientKey = key;
      this.statusValue = 'ready';
      return this.client;
    } catch (e) {
      console.warn('[Cthos:Gemini] init failed', e);
      this.statusValue = 'error';
      return null;
    }
  }

  private buildSystemPrompt(
    personaPrompt: string,
    tone: ToneProfile,
    lang: Utterance['language'],
  ): string {
    const languageInstruction =
      lang === 'hi'
        ? 'Reply primarily in Hinglish/Hindi.'
        : 'Reply primarily in English.';
    const toneHint = TONE_HINT[tone?.tone] ?? 'Stay natural and conversational.';
    return [
      personaPrompt,
      languageInstruction,
      `Current mood is "${tone?.tone ?? 'neutral'}". ${toneHint}`,
      'Keep replies concise and natural for voice (1–3 short sentences).',
    ].join('\n');
  }

  /**
   * Generate a persona-aware reply for a final utterance. Returns plain text
   * for TTS; on any failure returns a human-readable error sentence (and
   * raises ONE rate-limited Alert) — the voice loop never wedges.
   */
  async generateReply(input: {
    utterance: Utterance;
    persona?: PersonaId;
    tone?: ToneProfile;
  }): Promise<string> {
    const ai = await this.getClient();
    if (!ai) return NO_KEY_FALLBACK;

    const persona = PERSONAS[input.persona ?? personalityManager.current];
    const tone = input.tone ?? toneEngine.detect(input.utterance?.text ?? '');
    const lang = input.utterance.language === 'hi' ? 'hi' : 'en';
    const userText = String(input.utterance?.text ?? '').trim();
    if (!userText) return "I didn't quite catch that.";

    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] =
      this.history.slice(-8).map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      }));
    contents.push({ role: 'user', parts: [{ text: userText }] });

    try {
      const resp = await ai.models.generateContent({
        model: this.config.model,
        contents,
        config: {
          systemInstruction: this.buildSystemPrompt(persona.systemPrompt, tone, lang),
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
        },
      });
      this.statusValue = 'ready';
      const text = String(resp.text ?? '').trim();
      if (!text) throw new Error('empty response from model');

      // Remember the exchange for follow-up questions.
      this.history.push({ role: 'user', text: userText });
      this.history.push({ role: 'model', text });
      if (this.history.length > 16) this.history.splice(0, this.history.length - 16);

      return text;
    } catch (e) {
      const detail = describeError(e);
      console.warn('[Cthos:Gemini] generate failed:', detail);
      this.statusValue = 'error';
      alertFailureOnce(`Gemini API call failed: ${detail}`);
      return `I couldn't reach Gemini just now (${detail}). Check your connection and API key.`;
    }
  }
}

/** Shared, app-wide Gemini brain instance. */
export const geminiLive = new GeminiLiveSession();

/** Convenience singleton provider bound to the shared brain + current persona. */
export const geminiReplyProvider: ReplyProvider = (utterance) =>
  geminiLive.generateReply({ utterance });


