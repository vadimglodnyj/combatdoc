import { Module } from '@nestjs/common';
import { CareSegmentsController } from './care-segments.controller';
import { CareSegmentsService } from './care-segments.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [CareSegmentsController],
  providers: [CareSegmentsService],
  exports: [CareSegmentsService],
})
export class CareSegmentsModule {}
