import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  async sendToChat1(message: string) {
    console.log('[WhatsApp Chat 1]:', message);
    return { sent: true, chat: 1 };
  }

  async sendToChat2(message: string) {
    console.log('[WhatsApp Chat 2]:', message);
    return { sent: true, chat: 2 };
  }
}
