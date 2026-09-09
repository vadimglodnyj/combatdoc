import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServiceMembersModule } from './service-members/service-members.module';
import { DictionariesModule } from './dictionaries/dictionaries.module';
import { EpisodesModule } from './episodes/episodes.module';
import { InjuryCertificatesModule } from './injury-certificates/injury-certificates.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { CareSegmentsModule } from './care-segments/care-segments.module';
import { VlkModule } from './vlk/vlk.module';
import { JournalModule } from './journal/journal.module';
import { DocumentsModule } from './documents/documents.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { DiscordModule } from './discord/discord.module';
import { TasksModule } from './tasks/tasks.module';
import { PaymentsModule } from './payments/payments.module';
import { ImportModule } from './import/import.module';
import { ControlModule } from './control/control.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    ServiceMembersModule,
    DictionariesModule,
    EpisodesModule,
    InjuryCertificatesModule,
    ConsultationsModule,
    CareSegmentsModule,
    VlkModule,
    JournalModule,
    DocumentsModule,
    WhatsAppModule,
    DiscordModule,
    TasksModule,
    PaymentsModule,
    ImportModule,
    ControlModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
