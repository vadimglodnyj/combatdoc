import { Module } from '@nestjs/common';
import { VlkController } from './vlk.controller';
import { VlkService } from './vlk.service';

@Module({
  controllers: [VlkController],
  providers: [VlkService],
})
export class VlkModule {}
