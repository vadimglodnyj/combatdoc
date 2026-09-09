import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DictionariesService {
  constructor(private prisma: PrismaService) {}

  async getRanks() {
    return this.prisma.rank.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getUnits() {
    return this.prisma.unit.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getFacilities() {
    return this.prisma.facility.findMany({
      orderBy: { popularity: 'desc' },
    });
  }

  async getPractitionerRoles() {
    return this.prisma.practitionerRole.findMany({
      orderBy: { popularity: 'desc' },
    });
  }
}
