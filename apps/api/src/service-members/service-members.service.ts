import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ServiceMembersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.serviceMember.findMany({
      include: {
        rank: true,
        unit: true,
        episodes: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.serviceMember.findUnique({
      where: { id },
      include: {
        rank: true,
        unit: true,
        episodes: {
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }
}
