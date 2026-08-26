/**
 * WhatsApp & WhatsApp Business automation bridge — voice-triggered messaging,
 * unread reader, media attachment, VoIP call triggers.
 * Interface contract now; native accessibility/intent glue lands in STEP 4.
 */
import { SubAgentJob, SubAgentHandler } from '../ai/subAgentWorker';

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
    // STEP 4: route job.task -> send/read/attach/call via Accessibility/Bridge.
    switch (job.task.split(':')[0]) {
      case 'send':
        await this.sendMessage(job.task.split(':').slice(1).join(''));
        break;
      case 'read':
        await this.readUnread();
        break;
      default:
        console.warn('[Cthos] unhandled whatsapp task', job.task);
    }
  }

  async sendMessage(_composed: string): Promise<string> {
    return 'sent';
  }

  async readUnread(): Promise<WhatsAppMessage[]> {
    return [];
  }
}

export const whatsappService = new WhatsAppService();