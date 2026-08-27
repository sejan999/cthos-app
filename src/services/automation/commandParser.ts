/**
 * Voice Command Parser — turns EN/HI utterances into AutomateStep[] plus a
 * routing hint for the sub-agent framework. Deterministic regex-first design
 * keeps zero-latency local handling for common commands; unknown utterances
 * fall through to the Gemini conversation loop.
 */
import { AutomateStep } from './accessibilityBridge.types';
import { SubAgentKind } from '../types';

export interface ParsedCommand {
  /** false => not an automation intent; caller should use the AI chat path. */
  isAutomation: boolean;
  kind: SubAgentKind;
  steps: AutomateStep[];
  /** Short spoken confirmation template, e.g. "Opening WhatsApp". */
  ack: string;
}

const APP_WORDS: Record<string, string> = {
  whatsapp: 'whatsapp',
  whatsapps: 'whatsapp',
  business: 'whatsappbusiness',
  spotify: 'spotify',
  youtube: 'youtube',
  telegram: 'telegram',
  instagram: 'instagram',
  gmail: 'gmail',
  maps: 'maps',
};

function appFrom(raw: string): string | null {
  const w = raw.toLowerCase().replace(/[^a-z ]/g, '');
  for (const [k, v] of Object.entries(APP_WORDS)) {
    if (w.includes(k)) return v;
  }
  return null;
}

/** Hindi keywords: kholo/khol do = open, likho = type, bandh karo = toggle off */
const HI_OPEN = /(kholo|khol do|kholna|chalu karo)/i;
const HI_TOGGLE = /(bandh karo|on karo|off karo)/i;

export function parseCommand(utterance: string): ParsedCommand {
  const text = utterance.trim();
  const lower = text.toLowerCase();

  // --- open <app> ---
  const openMatch =
    /^(?:open|launch|start)\s+(.+)$/.exec(lower) || HI_OPEN.exec(lower);
  if (openMatch) {
    const app = appFrom(openMatch[1] ?? text);
    if (app) {
      return {
        isAutomation: true,
        kind: 'automation',
        steps: [{ op: 'openApp', app }],
        ack: `Opening ${app}`,
      };
    }
  }

  // --- set brightness / dnd / silent / hotspot ---
  const toggleWords: Array<[RegExp, string]> = [
    [/dnd|do not disturb/, 'dnd'],
    [/silent|mute/, 'silent'],
    [/hotspot/, 'hotspot'],
    [/brightness/, 'brightness'],
    [/lock.*screen|screen.*lock/, 'screen_lock'],
  ];
  for (const [re, toggle] of toggleWords) {
    if (
      re.test(lower) &&
      /(turn on|turn off|enable|disable|set|activate)/.test(lower) ||
      (HI_TOGGLE.test(lower) && re.test(lower))
    ) {
      return {
        isAutomation: true,
        kind: 'automation',
        steps: [{ op: 'toggle', toggle: toggle as never }],
        ack: `${toggle.replace('_', ' ')} toggled`,
      };
    }
  }

  // --- scroll up/down ---
  if (/scroll (up|down)/.test(lower)) {
    const dir = /up/.test(lower) ? 'up' : 'down';
    return {
      isAutomation: true,
      kind: 'automation',
      steps: [{ op: 'scroll', dir }],
      ack: `Scrolling ${dir}`,
    };
  }

  // --- whatsapp send/read ---
  if (/(whatsapp|message).*(send|bhej)/.test(lower) || /send.*(whatsapp|message)/.test(lower)) {
    return { isAutomation: true, kind: 'whatsapp', steps: [], ack: 'Sending WhatsApp message' };
  }
  if (/(read|check).*(whatsapp|unread)/.test(lower) || /unread/.test(lower)) {
    return { isAutomation: true, kind: 'whatsapp', steps: [], ack: 'Checking unread messages' };
  }

  // --- music / play ---
  if (/^(play|pause|resume)\b/.test(lower)) {
    const app = appFrom(text);
    return {
      isAutomation: true,
      kind: 'music',
      steps: [],
      ack: app ? `Playing on ${app}` : 'Playing',
    };
  }

  // --- named routine trigger ("run good morning") ---
  if (/^(run|execute|do)\s+[\w\s-]+$/.test(lower)) {
    const name = text.split(/\s+/).slice(1).join(' ');
    if (name.length > 1) {
      return {
        isAutomation: true,
        kind: 'macro',
        steps: [],
        ack: `Running routine ${name}`,
      };
    }
  }

  // Not recognized as automation — let Gemini handle it as conversation.
  return { isAutomation: false, kind: 'generic', steps: [], ack: '' };
}
