import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  @Post('send')
  sendMessage() {
    return { message: 'WhatsApp message send - to be implemented' };
  }
}
