/**
 * WhatsApp & WhatsApp Business automation bridge — voice-triggered messaging,
 * unread reader, media attachment, VoIP call triggers.
 *
 * STEP 4: jobs route through the shared sub-agent worker. Real gesture-level
 * actions (taps/typing inside chats) require the CthosAccessibility native
 * module from the EAS dev client; until then, sending opens the WhatsApp
 * deep link so voice "send a whatsapp" already does something useful.
 */
import { SubAgentJob, SubAgentHandler } from '../ai/subAgentWorker';
import {
  accessibilityBridge,
  AutomationResult,
} from '../automation/accessibilityBridge';

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  chatName: string;
  body: string;
  isFromMe: boolean;
  timestamp: number;
}

export class WhatsAppService implements SubAgentHandler {
  async execute(job: SubAgentJob): Promise<void> {
    switch (job.task.split(':')[0]) {
      case 'send':
        await this.sendMessage(job.task.split(':').slice(1).join(':') || '');
        break;
      case 'read':
        await this.readUnread();
        break;
      default:
        console.warn('[Cthos] unhandled whatsapp task', job.task);
    }
  }

  /** Opens WhatsApp (deep link works today; typed delivery needs native glue). */
  async sendMessage(composed = ''): Promise<string> {
    const result: AutomationResult = await accessibilityBridge.openApp('whatsapp');
    return result.ok ? 'opened' : result.detail;
  }

  async readUnread(): Promise<WhatsAppMessage[]> {
    // Native AccessibilityService reads notification/chat nodes (dev client).
    return [];
  }
}

export const whatsappService = new WhatsAppService();
