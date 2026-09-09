import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('discord')
@UseGuards(JwtAuthGuard)
export class DiscordController {
  @Post('notify')
  sendNotification() {
    return { message: 'Discord notification - to be implemented' };
  }
}
