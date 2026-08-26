/**
 * Shared contract types across Cthos service layers.
 * Concrete implementations arrive phase-by-phase; these interfaces keep the
 * architecture stable and testable.
 */

export type Language = 'en' | 'hi';

export type PersonaId = 'GF' | 'Professional' | 'Venom';

export type SubAgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'done'
  | 'failed';

export interface SubAgentJob {
  id: string;
  task: string;
  priority: number;
  createdAt: number;
  status: SubAgentStatus;
}

export interface Utterance {
  text: string;
  language: Language;
  confidence: number;
  timestamp: number;
}

/** Emotional/mood tone profile matched from user input. */
export type ToneId =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'urgent'
  | 'joking'
  | 'formal';

export interface ToneProfile {
  tone: ToneId;
  /** 0..1 confidence that this tone applies. */
  confidence: number;
  hint: string;
}

/** Concrete expo-speech options resolved per persona + language. */
export interface TtsSpeechOptions {
  language: string; // BCP-47, e.g. 'en-US' | 'hi-IN'
  voice?: string;
  pitch: number;
  rate: number;
  volume: number;
}

export type VoiceActivityEvent =
  | 'silence'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'interruption'
  | 'utterance_complete';

export type SubAgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'done'
  | 'failed';

export interface SubAgentJob {
  id: string;
  task: string;
  priority: number;
  createdAt: number;
  status: SubAgentStatus;
}

export interface VoiceEngineEvents {
  onInterim?: (partial: Utterance) => void;
  onFinal?: (utterance: Utterance) => void;
  onStateChange?: (event: VoiceActivityEvent) => void;
  /** Assistant finished voicing a reply — emitted for post-utterance logic. */
  onReplyDone?: (text: string) => void;
}

export interface VoiceEngine {
  start(): Promise<void>;
  stop(): Promise<void>;
  switchLanguage(lang: Language): void;
  setPersona?(): void;
  say?(text: string): Promise<void>;
}

/** A single completed exchange in a conversation. */
export interface AssistantTurn {
  userText: string;
  replyText: string;
  tone: ToneProfile;
  language: Language;
  timestamp: number;
}