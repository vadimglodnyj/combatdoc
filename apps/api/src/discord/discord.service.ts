import { Injectable } from '@nestjs/common';

@Injectable()
export class DiscordService {
  async sendMessage(message: string) {
    console.log('[Discord]:', message);
    return { sent: true };
  }

  async sendReminder(title: string, description: string) {
    console.log('[Discord Reminder]:', title, description);
    return { sent: true };
  }
}
