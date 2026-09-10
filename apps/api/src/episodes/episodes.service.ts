import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { ListEpisodesQueryDto } from './dto/list-episodes-query.dto';
import { computeContinuousDays120 } from '../common/continuous-days';

@Injectable()
export class EpisodesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEpisodeDto, userId: string) {
    const member = await this.prisma.serviceMember.findUnique({
      where: { id: dto.serviceMemberId },
    });

    if (!member) {
      throw new NotFoundException('Service member not found');
    }

    const episode = await this.prisma.episode.create({
      data: {
        serviceMemberId: dto.serviceMemberId,
        nature: dto.nature,
        diagnosis: dto.diagnosis,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
      },
      include: {
        serviceMember: {
          include: {
            rank: true,
            unit: true,
          },
        },
        injuryCertificate: true,
      },
    });

    // Create InjuryCertificate if COMBAT
    if (dto.nature === 'COMBAT') {
      await this.prisma.injuryCertificate.create({
        data: {
          episodeId: episode.id,
          status: 'MISSING',
        },
      });
    }

    // Journal entry
    await this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: dto.serviceMemberId,
        episodeId: episode.id,
        userId,
        action: `Створено епізод: ${dto.nature} - ${dto.diagnosis}`,
      },
    });

    return this.findOne(episode.id);
  }

  async findAll(query: ListEpisodesQueryDto) {
    const where: any = {};

    if (query.serviceMemberId) {
      where.serviceMemberId = query.serviceMemberId;
    }

    if (query.nature) {
      where.nature = query.nature;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.missingCert) {
      where.AND = [
        { nature: 'COMBAT' },
        {
          injuryCertificate: {
            status: {
              in: ['MISSING', 'PENDING', 'REJECTED'],
            },
          },
        },
      ];
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { diagnosis: { contains: search, mode: 'insensitive' } },
        { serviceMember: { lastName: { contains: search, mode: 'insensitive' } } },
        { serviceMember: { firstName: { contains: search, mode: 'insensitive' } } },
        { serviceMember: { middleName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [episodes, total] = await Promise.all([
      this.prisma.episode.findMany({
        where,
        include: {
          serviceMember: {
            include: {
              rank: true,
              unit: true,
            },
          },
          injuryCertificate: true,
          consultations: {
            include: { facility: true, practitionerRole: true },
          },
          careSegments: {
            include: { facility: true },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
        skip: query.skip || 0,
        take: query.take || 50,
      }),
      this.prisma.episode.count({ where }),
    ]);

    return {
      data: episodes.map((ep) => this.enrichEpisode(ep)),
      total,
      skip: query.skip || 0,
      take: query.take || 50,
    };
  }

  async findOne(id: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
      include: {
        serviceMember: {
          include: {
            rank: true,
            unit: true,
          },
        },
        injuryCertificate: true,
        consultations: {
          include: {
            facility: true,
            practitionerRole: true,
          },
        },
        careSegments: {
          include: { facility: true },
        },
        vlkDecisions: true,
      },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    return this.enrichEpisode(episode);
  }

  async update(id: string, dto: UpdateEpisodeDto, userId: string) {
    const episode = await this.findOne(id);

    const updated = await this.prisma.episode.update({
      where: { id },
      data: {
        ...(dto.diagnosis && { diagnosis: dto.diagnosis }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      },
    });

    // Journal entry
    await this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: episode.serviceMemberId,
        episodeId: id,
        userId,
        action: `Оновлено епізод: ${dto.diagnosis || episode.diagnosis}`,
      },
    });

    return this.findOne(id);
  }

  async close(id: string, userId: string) {
    const episode = await this.findOne(id);

    if (!episode.isActive) {
      throw new BadRequestException('Episode is already closed');
    }

    await this.prisma.episode.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    await this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: episode.serviceMemberId,
        episodeId: id,
        userId,
        action: `Закрито епізод: ${episode.diagnosis}`,
      },
    });

    return this.findOne(id);
  }

  async reopen(id: string, userId: string) {
    const episode = await this.findOne(id);

    if (episode.isActive) {
      throw new BadRequestException('Episode is already active');
    }

    await this.prisma.episode.update({
      where: { id },
      data: {
        isActive: true,
        endDate: null,
      },
    });

    await this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: episode.serviceMemberId,
        episodeId: id,
        userId,
        action: `Відкрито повторно епізод: ${episode.diagnosis}`,
      },
    });

    return this.findOne(id);
  }

  async remove(id: string, userId: string) {
    const episode = await this.findOne(id);

    await this.prisma.episode.delete({
      where: { id },
    });

    await this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: episode.serviceMemberId,
        userId,
        action: `Видалено епізод: ${episode.diagnosis}`,
      },
    });

    return { message: 'Episode deleted successfully' };
  }

  private enrichEpisode(episode: any) {
    const cert = episode.injuryCertificate;
    const paymentBlockedByCert =
      episode.nature === 'COMBAT' &&
      cert &&
      cert.status !== 'VERIFIED';

    return {
      ...episode,
      continuousDays120: computeContinuousDays120(episode.careSegments || []),
      paymentBlockedByCert,
    };
  }
}
