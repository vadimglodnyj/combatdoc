import { Module } from '@nestjs/common';
import { InjuryCertificatesController } from './injury-certificates.controller';
import { InjuryCertificatesService } from './injury-certificates.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InjuryCertificatesController],
  providers: [InjuryCertificatesService],
  exports: [InjuryCertificatesService],
})
export class InjuryCertificatesModule {}
