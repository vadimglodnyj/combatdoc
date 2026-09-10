import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CareSegmentType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { computeContinuousDays120 } from '../common/continuous-days';
import { formatDispatchLine } from '../common/dispatch-message';
import { ListClinicalQueryDto } from '../consultations/dto/list-clinical-query.dto';
import {
  CloseCareSegmentDto,
  CreateCareSegmentDto,
  ProlongCareSegmentDto,
  TransitionCareSegmentDto,
  UpdateCareSegmentDto,
} from './dto/care-segment.dto';

const include = {
  facility: true,
  episode: {
    include: {
      serviceMember: { include: { rank: true, unit: true } },
    },
  },
} as const;

const ACTION_LABEL: Record<string, string> = {
  HOSP: 'Стаціонар',
  DAY: 'Денний стаціонар',
  AMB: 'Поліклініка',
  MPBR: 'МПБр',
  REHAB: 'Реабілітація',
  ABROAD: 'За кордоном',
  PHYS: 'Звільнення за фіз.',
  VLK_LEAVE: 'Відпустка ВЛК',
};

@Injectable()
export class CareSegmentsService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  async findAll(query: ListClinicalQueryDto = {}) {
    const search = query.search?.trim();
    const page = query.page ?? 1;
    const take = query.take ?? 30;
    const skip = (page - 1) * take;

    const where: Prisma.CareSegmentWhereInput = {};
    if (query.episodeId) where.episodeId = query.episodeId;
    if (query.serviceMemberId) where.episode = { serviceMemberId: query.serviceMemberId };
    if (query.type) where.type = query.type as CareSegmentType;
    if (query.active === true) where.dateTo = null;
    if (query.active === false) where.dateTo = { not: null };
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

  async findOne(id: string) {
    const item = await this.prisma.careSegment.findUnique({ where: { id }, include });
    if (!item) throw new NotFoundException('Сегмент не знайдено');
    return item;
  }

  async create(dto: CreateCareSegmentDto, userId: string) {
    const episode = await this.requireEpisode(dto.episodeId);
    const open = await this.prisma.careSegment.findFirst({
      where: { episodeId: dto.episodeId, dateTo: null },
    });
    if (open) {
      throw new BadRequestException(
        'В епізоді вже є відкритий сегмент. Закрийте його або зробіть перехід.',
      );
    }

    const created = await this.prisma.careSegment.create({
      data: {
        episodeId: dto.episodeId,
        type: dto.type,
        facilityId: dto.facilityId,
        dateFrom: new Date(dto.dateFrom),
        dateTo: dto.dateTo ? new Date(dto.dateTo) : null,
        documentNumber: dto.documentNumber || null,
        diagnosis: dto.diagnosis || episode.diagnosis,
        notes: dto.notes || null,
      },
      include,
    });

    await this.refreshDays(dto.episodeId);
    await this.journal(
      userId,
      episode.serviceMemberId,
      episode.id,
      `Відкрито сегмент: ${ACTION_LABEL[dto.type] || dto.type}`,
      { careSegmentId: created.id },
    );
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateCareSegmentDto, userId: string) {
    const existing = await this.findOne(id);
    await this.prisma.careSegment.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.facilityId && { facilityId: dto.facilityId }),
        ...(dto.dateFrom && { dateFrom: new Date(dto.dateFrom) }),
        ...(dto.dateTo !== undefined && { dateTo: dto.dateTo ? new Date(dto.dateTo) : null }),
        ...(dto.documentNumber !== undefined && { documentNumber: dto.documentNumber || null }),
        ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis || null }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
      },
    });
    await this.refreshDays(existing.episodeId);
    await this.journal(
      userId,
      existing.episode.serviceMemberId,
      existing.episodeId,
      'Оновлено сегмент лікування',
      { careSegmentId: id },
    );
    return this.findOne(id);
  }

  async close(id: string, dto: CloseCareSegmentDto, userId: string) {
    const existing = await this.findOne(id);
    if (existing.dateTo) throw new BadRequestException('Сегмент уже закритий');
    const dateTo = dto.dateTo ? new Date(dto.dateTo) : new Date();
    await this.prisma.careSegment.update({
      where: { id },
      data: { dateTo },
    });
    await this.refreshDays(existing.episodeId);
    await this.journal(
      userId,
      existing.episode.serviceMemberId,
      existing.episodeId,
      `Закрито сегмент: ${ACTION_LABEL[existing.type] || existing.type}`,
      { careSegmentId: id },
    );
    return this.findOne(id);
  }

  async prolong(id: string, dto: ProlongCareSegmentDto, userId: string) {
    const existing = await this.findOne(id);
    if (existing.type !== 'AMB') {
      throw new BadRequestException('Продовжити можна лише поліклініку (AMB)');
    }
    const dateTo = new Date(dto.dateTo);
    const currentEnd = existing.dateTo || existing.dateFrom;
    if (dateTo <= currentEnd) {
      throw new BadRequestException('Нова дата має бути пізніше поточної');
    }
    await this.prisma.careSegment.update({ where: { id }, data: { dateTo } });
    await this.refreshDays(existing.episodeId);
    await this.journal(
      userId,
      existing.episode.serviceMemberId,
      existing.episodeId,
      'Продовжено поліклініку',
      { careSegmentId: id, dateTo: dto.dateTo },
    );
    return this.findOne(id);
  }

  async transition(id: string, dto: TransitionCareSegmentDto, userId: string) {
    const existing = await this.findOne(id);
    const closeOn = dto.dateFrom ? this.dayBefore(new Date(dto.dateFrom)) : new Date();
    const nextFrom =
      existing.type === 'HOSP' && dto.type === 'VLK_LEAVE'
        ? this.nextDay(closeOn)
        : dto.dateFrom
          ? new Date(dto.dateFrom)
          : new Date();

    if (!existing.dateTo) {
      await this.prisma.careSegment.update({
        where: { id },
        data: { dateTo: closeOn },
      });
    }

    const created = await this.prisma.careSegment.create({
      data: {
        episodeId: existing.episodeId,
        type: dto.type,
        facilityId: dto.facilityId,
        dateFrom: nextFrom,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : null,
        documentNumber: dto.documentNumber || null,
        diagnosis: dto.diagnosis || existing.diagnosis || existing.episode.diagnosis,
        notes: dto.notes || null,
      },
      include,
    });

    await this.refreshDays(existing.episodeId);
    await this.journal(
      userId,
      existing.episode.serviceMemberId,
      existing.episodeId,
      `Перехід: ${ACTION_LABEL[existing.type] || existing.type} → ${ACTION_LABEL[dto.type] || dto.type}`,
      { fromId: id, toId: created.id },
    );
    return this.findOne(created.id);
  }

  async dispatch(id: string, chats: Array<1 | 2>, userId: string) {
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
      action: ACTION_LABEL[item.type] || item.type,
      diagnosis: item.diagnosis || item.episode.diagnosis,
    });

    const targets = chats.length ? chats : this.defaultChats(item.type);
    if (targets.includes(1)) await this.whatsapp.sendToChat1(text);
    if (targets.includes(2)) await this.whatsapp.sendToChat2(text);

    await this.prisma.careSegment.update({
      where: { id },
      data: { whatsappStatus: `sent:${targets.join('+')}` },
    });

    await this.journal(
      userId,
      member.id,
      item.episodeId,
      `Подано сегмент у чат ${targets.join('+')}`,
      { careSegmentId: id, chats: targets },
    );
    return { sent: true, chats: targets, text };
  }

  private defaultChats(type: string): Array<1 | 2> {
    if (['AMB', 'HOSP', 'VLK_LEAVE', 'MPBR'].includes(type)) return [1, 2];
    return [2];
  }

  private dayBefore(date: Date): Date {
    return new Date(date.getTime() - 24 * 60 * 60 * 1000);
  }

  private nextDay(date: Date): Date {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000);
  }

  private async refreshDays(episodeId: string) {
    const segments = await this.prisma.careSegment.findMany({ where: { episodeId } });
    const days = computeContinuousDays120(segments);
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: { continuousDays120: days },
    });
  }

  private async requireEpisode(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
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
