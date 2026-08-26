/**
 * Agent Orchestrator — routes user utterances to the correct capability,
 * detects persona-switch commands, and tracks tone + language + confidence.
 */
import { PersonaId, Language, ToneProfile } from '../types';
import { toneEngine } from './toneEngine';
import { personalityManager } from './personalityManager';

export type AgentAction =
  | 'chat'
  | 'automation'
  | 'whatsapp'
  | 'music'
  | 'vision'
  | 'macro'
  | 'persona_switch'
  | 'unknown';

export interface AgentIntent {
  raw: string;
  normalized: string;
  language: Language;
  persona: PersonaId;
  action: AgentAction;
  tone: ToneProfile;
  /** New persona to activate, if this is a persona_switch intent. */
  requestedPersona?: PersonaId;
  confidence: number;
}

const PERSONA_WORDS: Record<PersonaId, string[]> = {
  GF: ['gf mode', 'girlfriend', 'girlfriend mode'],
  Professional: ['professional', 'professional mode', 'executive', 'business mode'],
  Venom: ['venom', 'venom mode', 'angry mode', 'edgy mode', 'savage mode'],
};

/** Keyword -> capability routing (English + Hindi/Hinglish cues). */
const ROUTES: { action: AgentAction; keywords: string[] }[] = [
  { action: 'macro', keywords: ['macro', 'routine', 'record steps', 'मैक्रो'] },
  { action: 'whatsapp', keywords: ['whatsapp', 'send message', 'message', 'text ', 'reply', 'व्हाट्सएप'] },
  { action: 'music', keywords: ['music', ' play', 'song', 'playlist', 'spotify', 'गाना'] },
  { action: 'vision', keywords: ['look ', 'screen', 'see this', 'camera', 'vision', 'देखो'] },
  { action: 'automation', keywords: ['turn ', 'switch on', 'switch off', 'brightness', 'hotspot', 'dnd', 'lock screen'] },
];

export class AgentOrchestrator {
  /** Classify the assistant intent, persona, tone and language. */
  classify(raw: string, language: Language): AgentIntent {
    const normalized = raw.trim().toLowerCase();
    const requestedPersona = this.detectPersona(normalized);
    const tone = toneEngine.detect(raw);
    const persona = personalityManager.current;
    return {
      raw,
      normalized,
      language,
      persona,
      action: requestedPersona ? 'persona_switch' : this.routeAction(normalized),
      tone,
      ...(requestedPersona ? { requestedPersona } : {}),
      confidence: this.score(normalized, requestedPersona),
    };
  }

  /** If the utterance asks to change persona, return that persona. */
  private detectPersona(norm: string): PersonaId | undefined {
    for (const [id, words] of Object.entries(PERSONA_WORDS)) {
      if (words.some((w) => norm.includes(w))) {
        return id as PersonaId;
      }
    }
    if (/^gf(\s|$)/.test(norm)) return 'GF';
    return undefined;
  }

  private routeAction(norm: string): AgentAction {
    for (const route of ROUTES) {
      if (route.keywords.some((k) => norm.includes(k))) return route.action;
    }
    return 'chat';
  }

  private score(norm: string, persona?: PersonaId): number {
    if (persona) return 1;
    return norm.length > 6 ? 0.7 : 0.5;
  }
}

export const agentOrchestrator = new AgentOrchestrator();