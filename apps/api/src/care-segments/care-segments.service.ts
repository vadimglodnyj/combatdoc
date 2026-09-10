import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ListClinicalQueryDto } from '../consultations/dto/list-clinical-query.dto';

@Injectable()
export class CareSegmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ListClinicalQueryDto = {}) {
    const search = query.search?.trim();
    const page = query.page ?? 1;
    const take = query.take ?? 30;
    const skip = (page - 1) * take;

    const where: Prisma.CareSegmentWhereInput = {};
    if (query.episodeId) where.episodeId = query.episodeId;
    if (query.serviceMemberId) {
      where.episode = { serviceMemberId: query.serviceMemberId };
    }
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { diagnosis: { contains: search, mode: 'insensitive' } },
        { episode: { diagnosis: { contains: search, mode: 'insensitive' } } },
        { episode: { serviceMember: { lastName: { contains: search, mode: 'insensitive' } } } },
        { episode: { serviceMember: { firstName: { contains: search, mode: 'insensitive' } } } },
        { facility: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const include = {
      facility: true,
      episode: {
        include: {
          serviceMember: { include: { rank: true, unit: true } },
        },
      },
    } as const;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.careSegment.findMany({
        where,
        include,
        orderBy: [{ dateFrom: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.careSegment.count({ where }),
    ]);

    return { items, total, page, take };
  }
}
