import { Module } from '@nestjs/common';
import { ServiceMembersController } from './service-members.controller';
import { ServiceMembersService } from './service-members.service';

@Module({
  controllers: [ServiceMembersController],
  providers: [ServiceMembersService],
  exports: [ServiceMembersService],
})
export class ServiceMembersModule {}
