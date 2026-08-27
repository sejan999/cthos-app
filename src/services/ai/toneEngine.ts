/**
 * ToneEngine — emotional tone matching for the voice conversation.
 *
 * Given a user utterance it returns a ToneProfile (neutral / happy / sad /
 * anxious / urgent / joking / formal) with a 0..1 confidence. The Personality
 * Engine uses this to shape the reply and adapt prosody in real time.
 * Keyword heuristics run against multilingual (EN + Hindi/Hinglish) cues.
 */
import { ToneId, ToneProfile } from '../types';

interface ToneRule {
  tone: ToneId;
  keywords: string[];
  hint: string;
}

const RULES: ToneRule[] = [
  {
    tone: 'happy',
    keywords: ['great', 'awesome', 'love it', 'amazing', 'nice', 'yay', 'wohoo', 'dhanyavad', 'badhiya'],
    hint: 'Positive energy — reply with warmth and energy.',
  },
  {
    tone: 'sad',
    keywords: ['sad', 'depressed', 'down', 'bad day', 'lonely', 'crying', 'dil toota', 'udaas'],
    hint: 'Low mood — be gentle, reassuring and supportive.',
  },
  {
    tone: 'anxious',
    keywords: ['nervous', 'worried', 'stressed', 'scared', 'anxious', 'panic', 'fear', 'ghabra'],
    hint: 'Anxiety — calm, concrete and grounding.',
  },
  {
    tone: 'urgent',
    keywords: ['now', 'asap', 'hurry', 'quick', 'urgent', 'emergency', 'jaldi', 'turant'],
    hint: 'Urgency — be fast, concise, action-first.',
  },
  {
    tone: 'joking',
    keywords: ['haha', 'lol', 'funny', 'joke', 'hehe', 'mazaak'],
    hint: 'Playful — lighten tone and embrace wit.',
  },
  {
    tone: 'formal',
    keywords: ['please', 'kindly', 'sir', 'maam', 'regards', 'appreciate'],
    hint: 'Formal — keep it respectful and structured.',
  },
];

export class ToneEngine {
  detect(text: string): ToneProfile {
    // Coerce: voice/STT layers may hand us null-ish on odd devices.
    const raw = typeof text === 'string' ? text : String(text ?? '');
    const lower = raw.toLowerCase().trim();
    if (!lower) return { tone: 'neutral', confidence: 0, hint: 'No input' };

    let best: ToneProfile = { tone: 'neutral', confidence: 0.1, hint: 'Neutral baseline.' };
    for (const rule of RULES) {
      const hits = rule.keywords.filter((k) => lower.includes(k)).length;
      if (hits && hits / rule.keywords.length > best.confidence) {
        best = {
          tone: rule.tone,
          confidence: Math.min(1, hits * 0.4),
          hint: rule.hint,
        };
      }
    }

    // An all-caps phrase reads as emphasis / urgency.
    if (raw.length > 6 && raw === raw.toUpperCase()) {
      best = { tone: 'urgent', confidence: Math.max(best.confidence, 0.7), hint: 'Emphatic shouting — urgent.' };
    }
    return best;
  }
}

export const toneEngine = new ToneEngine();