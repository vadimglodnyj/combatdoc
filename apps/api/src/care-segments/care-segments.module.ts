import { Module } from '@nestjs/common';
import { CareSegmentsController } from './care-segments.controller';
import { CareSegmentsService } from './care-segments.service';

@Module({
  controllers: [CareSegmentsController],
  providers: [CareSegmentsService],
})
export class CareSegmentsModule {}
