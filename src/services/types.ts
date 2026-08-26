/**
 * Shared contract types across Cthos service layers.
 * Concrete implementations arrive phase-by-phase; these interfaces keep the
 * architecture stable and testable.
 */

export type Language = 'en' | 'hi';

export type PersonaId = 'GF' | 'Professional' | 'Venom';

export type VoiceActivityEvent =
  | 'silence'
  | 'speaking'
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

export interface Utterance {
  text: string;
  language: Language;
  confidence: number;
  timestamp: number;
}

export interface VoiceEngineEvents {
  onInterim?: (partial: Utterance) => void;
  onFinal?: (utterance: Utterance) => void;
  onStateChange?: (event: VoiceActivityEvent) => void;
}

export interface VoiceEngine {
  start(): Promise<void>;
  stop(): Promise<void>;
  switchLanguage(lang: Language): void;
}