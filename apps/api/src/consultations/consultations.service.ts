import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CareSegmentType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { DiscordService } from '../discord/discord.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CareSegmentsService } from '../care-segments/care-segments.service';
import { formatDispatchLine } from '../common/dispatch-message';
import { ListClinicalQueryDto } from './dto/list-clinical-query.dto';
import {
  ConsultationOutcomeDto,
  CreateConsultationDto,
  UpdateConsultationDto,
} from './dto/consultation.dto';

const include = {
  facility: true,
  practitionerRole: true,
  episode: {
    include: {
      serviceMember: { include: { rank: true, unit: true } },
    },
  },
} as const;

@Injectable()
export class ConsultationsService {
  constructor(
    private prisma: PrismaService,
    private discord: DiscordService,
    private whatsapp: WhatsAppService,
    private careSegments: CareSegmentsService,
  ) {}

  async findAll(query: ListClinicalQueryDto = {}) {
    const search = query.search?.trim();
    const page = query.page ?? 1;
    const take = query.take ?? 30;
    const skip = (page - 1) * take;

    const where: Prisma.ConsultationWhereInput = {};
    if (query.episodeId) where.episodeId = query.episodeId;
    if (query.serviceMemberId) where.episode = { serviceMemberId: query.serviceMemberId };
    if (query.kind) where.kind = query.kind;
    if (query.status) where.status = query.status;
    if (query.onDate) {
      const start = new Date(`${query.onDate}T00:00:00.000Z`);
      const end = new Date(`${query.onDate}T23:59:59.999Z`);
      const onDay = { scheduledDate: { gte: start, lte: end } };
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        query.includeUnscheduled
          ? { OR: [onDay, { scheduledDate: null }] }
          : onDay,
      ];
    }
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { episode: { diagnosis: { contains: search, mode: 'insensitive' } } },
        { episode: { serviceMember: { lastName: { contains: search, mode: 'insensitive' } } } },
        { episode: { serviceMember: { firstName: { contains: search, mode: 'insensitive' } } } },
        { facility: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.consultation.findMany({
        where,
        include,
        orderBy: [{ completedDate: 'desc' }, { scheduledDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.consultation.count({ where }),
    ]);

    return { items, total, page, take };
  }

  async findOne(id: string) {
    const item = await this.prisma.consultation.findUnique({ where: { id }, include });
    if (!item) throw new NotFoundException('Консультацію не знайдено');
    return item;
  }

  async create(dto: CreateConsultationDto, userId: string) {
    const episode = await this.requireEpisode(dto.episodeId);
    const status = dto.status || 'PLANNED';
    const created = await this.prisma.consultation.create({
      data: {
        episodeId: dto.episodeId,
        kind: dto.kind,
        status,
        facilityId: dto.facilityId,
        practitionerRoleId: dto.practitionerRoleId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        completedDate: dto.completedDate
          ? new Date(dto.completedDate)
          : status === 'DONE'
            ? new Date()
            : null,
        notes: dto.notes || null,
      },
      include,
    });

    await this.journal(
      userId,
      episode.serviceMemberId,
      episode.id,
      `Консультація: ${created.kind} / ${created.status}`,
      { consultationId: created.id },
    );

    if (created.status === 'PLANNED') {
      await this.notifyPlanned(created);
    }

    if (dto.outcome && dto.outcome.kind !== 'NONE') {
      await this.applyOutcome(created, dto.outcome, userId);
    }

    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateConsultationDto, userId: string) {
    const existing = await this.findOne(id);
    const status = dto.status || existing.status;
    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        ...(dto.kind && { kind: dto.kind }),
        ...(dto.status && { status: dto.status }),
        ...(dto.facilityId && { facilityId: dto.facilityId }),
        ...(dto.practitionerRoleId && { practitionerRoleId: dto.practitionerRoleId }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
        ...(dto.scheduledDate !== undefined && {
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        }),
        ...(dto.completedDate !== undefined && {
          completedDate: dto.completedDate ? new Date(dto.completedDate) : null,
        }),
        ...(status === 'DONE' && !dto.completedDate && !existing.completedDate
          ? { completedDate: new Date() }
          : {}),
      },
      include,
    });

    await this.journal(
      userId,
      existing.episode.serviceMemberId,
      existing.episodeId,
      `Оновлено консультацію: ${updated.status}`,
      { consultationId: id },
    );

    if (dto.outcome && dto.outcome.kind !== 'NONE') {
      await this.applyOutcome(updated, dto.outcome, userId);
    }

    return this.findOne(id);
  }

  async complete(id: string, dto: UpdateConsultationDto, userId: string) {
    return this.update(id, { ...dto, status: 'DONE' }, userId);
  }

  async cancel(id: string, userId: string) {
    return this.update(id, { status: 'CANCELLED' }, userId);
  }

  async remindPlanned(query: ListClinicalQueryDto) {
    const { items } = await this.findAll({
      ...query,
      status: 'PLANNED',
      take: query.take ?? 100,
    });
    for (const item of items) {
      await this.notifyPlanned(item);
    }
    return { sent: items.length };
  }

  async dispatch(id: string, userId: string) {
    const item = await this.findOne(id);
    const member = item.episode.serviceMember;
    const text = formatDispatchLine({
      unitShort: member.unitShortName || member.unit?.shortName,
      lastName: member.lastName,
      firstName: member.firstName,
      middleName: member.middleName,
      rankName: member.rank?.name,
      serviceType: member.serviceType,
      birthDate: member.birthDate,
      phone: member.phone,
      action: item.kind === 'EXAM' ? 'Обстеження' : 'Консультація',
      diagnosis: item.episode.diagnosis,
    });
    await this.whatsapp.sendToChat2(text);
    await this.journal(userId, member.id, item.episodeId, 'Подано консультацію в чат 2', {
      consultationId: id,
    });
    return { sent: true, chat: 2, text };
  }

  private async applyOutcome(
    parent: Prisma.ConsultationGetPayload<{ include: typeof include }>,
    outcome: ConsultationOutcomeDto,
    userId: string,
  ) {
    if (outcome.kind === 'CONSULTATION' || outcome.kind === 'EXAM') {
      const child = await this.prisma.consultation.create({
        data: {
          episodeId: parent.episodeId,
          kind: outcome.kind === 'EXAM' ? 'EXAM' : 'VISIT',
          status: 'PLANNED',
          facilityId: outcome.facilityId || parent.facilityId,
          practitionerRoleId: outcome.practitionerRoleId || parent.practitionerRoleId,
          scheduledDate: outcome.scheduledDate ? new Date(outcome.scheduledDate) : null,
          notes: outcome.notes || `Наступна дія після ${parent.kind}`,
        },
        include,
      });
      await this.notifyPlanned(child);
      return;
    }

    if (outcome.kind === 'CARE_SEGMENT') {
      if (!outcome.type || !Object.values(CareSegmentType).includes(outcome.type as CareSegmentType)) {
        throw new BadRequestException('Для сегмента потрібен тип (HOSP, AMB, …)');
      }
      await this.careSegments.create(
        {
          episodeId: parent.episodeId,
          type: outcome.type as CareSegmentType,
          facilityId: outcome.facilityId || parent.facilityId,
          dateFrom: new Date().toISOString().slice(0, 10),
          diagnosis: parent.episode.diagnosis,
          notes: outcome.notes,
        },
        userId,
      );
    }
  }

  private async notifyPlanned(item: { episode: any; kind: string; scheduledDate: Date | null }) {
    const member = item.episode.serviceMember;
    const when = item.scheduledDate
      ? item.scheduledDate.toISOString().slice(0, 10)
      : 'без дати';
    const pib = `${member.lastName} ${member.firstName} ${member.middleName}`.trim();
    await this.discord.sendReminder(
      `PLANNED ${item.kind}`,
      `${pib} · ${item.episode.diagnosis} · ${when}`,
    );
  }

  private async requireEpisode(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      include: { serviceMember: { include: { rank: true, unit: true } } },
    });
    if (!episode) throw new NotFoundException('Епізод не знайдено');
    return episode;
  }

  private journal(
    userId: string,
    patientId: string,
    episodeId: string,
    action: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.journalEntry.create({
      data: { type: 'CLINICAL', userId, patientId, episodeId, action, metadata },
    });
  }
}
