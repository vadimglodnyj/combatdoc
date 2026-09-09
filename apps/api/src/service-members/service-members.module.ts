import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ServiceMembersController } from './service-members.controller';
import { ServiceMembersService } from './service-members.service';
import { ImportService } from './import.service';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [ServiceMembersController],
  providers: [ServiceMembersService, ImportService],
  exports: [ServiceMembersService],
})
export class ServiceMembersModule {}
