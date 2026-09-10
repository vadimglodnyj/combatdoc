import { Module } from '@nestjs/common';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { DiscordModule } from '../discord/discord.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { CareSegmentsModule } from '../care-segments/care-segments.module';

@Module({
  imports: [DiscordModule, WhatsAppModule, CareSegmentsModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
})
export class ConsultationsModule {}
