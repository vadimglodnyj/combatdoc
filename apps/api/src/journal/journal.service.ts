import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async logClinical(action: string, userId: string, patientId: string, metadata?: any) {
    return this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        action,
        userId,
        patientId,
        metadata,
      },
    });
  }

  async logSystem(action: string, userId: string, metadata?: any) {
    return this.prisma.journalEntry.create({
      data: {
        type: 'SYSTEM',
        action,
        userId,
        metadata,
      },
    });
  }
}
