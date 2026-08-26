/**
 * Agent Orchestrator — routes user utterances to the correct sub-agent and
 * parses persona + language metadata. Real routing + LLM glue lands in STEP 3
 * (Voice & Personality) and STEP 4 (Sub-Agent framework).
 */
import { PersonaId, Language } from '../types';

export interface AgentIntent {
  raw: string;
  normalized: string;
  language: Language;
  persona: PersonaId;
  action: 'chat' | 'automation' | 'whatsapp' | 'music' | 'vision' | 'macro' | 'unknown';
  confidence: number;
}

export class AgentOrchestrator {
  /** Classify which Cthos capability an utterance should drive. */
  classify(raw: string, language: Language = 'en'): AgentIntent {
    const normalized = raw.trim().toLowerCase();
    return {
      raw,
      normalized,
      language,
      persona: this.detectPersona(raw),
      action: this.routeAction(normalized),
      confidence: this.score(normalized),
    };
  }

  private detectPersona(raw: string): PersonaId {
    // TODO(STEP 3): personality switch words & tone detection.
    return 'Professional';
  }

  private routeAction(norm: string): AgentIntent['action'] {
    if (norm.startsWith('macros') || norm.startsWith('routine')) return 'macro';
    if (norm.includes('whatsapp') || norm.includes('message')) return 'whatsapp';
    if (norm.includes('music') || norm.includes('play')) return 'music';
    if (norm.includes('look') || norm.includes('screen')) return 'vision';
    if (norm.startsWith('turn') || norm.includes('brightness')) return 'automation';
    return 'chat';
  }

  private score(_: string): number {
    return 1;
  }
}

export const agentOrchestrator = new AgentOrchestrator();