import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateServiceMemberDto } from './dto/create-service-member.dto';
import { UpdateServiceMemberDto } from './dto/update-service-member.dto';

@Injectable()
export class ServiceMembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { lastName: { contains: search, mode: 'insensitive' as any } },
            { firstName: { contains: search, mode: 'insensitive' as any } },
            { middleName: { contains: search, mode: 'insensitive' as any } },
            { phone: { contains: search } },
          ],
        }
      : {};

    return this.prisma.serviceMember.findMany({
      where,
      include: {
        rank: true,
        unit: true,
        episodes: {
          where: { isActive: true },
          take: 1,
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.serviceMember.findUnique({
      where: { id },
      include: {
        rank: true,
        unit: true,
        episodes: {
          orderBy: { startDate: 'desc' },
          include: {
            consultations: { take: 5 },
            careSegments: { take: 5 },
            injuryCertificate: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`ServiceMember with ID ${id} not found`);
    }

    return member;
  }

  async create(dto: CreateServiceMemberDto, userId: string) {
    const { birthDate, recruitmentDate, ...rest } = dto;

    const member = await this.prisma.serviceMember.create({
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        recruitmentDate: recruitmentDate ? new Date(recruitmentDate) : undefined,
      },
      include: {
        rank: true,
        unit: true,
      },
    });

    await this.prisma.journalEntry.create({
      data: {
        type: 'SYSTEM',
        action: 'SERVICE_MEMBER_CREATED',
        patientId: member.id,
        userId,
        metadata: {
          memberId: member.id,
          name: `${member.lastName} ${member.firstName} ${member.middleName}`,
        },
      },
    });

    return member;
  }

  async update(id: string, dto: UpdateServiceMemberDto, userId: string) {
    const existing = await this.prisma.serviceMember.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`ServiceMember with ID ${id} not found`);
    }

    const updateData: any = { ...dto };
    
    if (dto.birthDate) {
      updateData.birthDate = new Date(dto.birthDate);
    }
    if (dto.recruitmentDate) {
      updateData.recruitmentDate = new Date(dto.recruitmentDate);
    }

    const updated = await this.prisma.serviceMember.update({
      where: { id },
      data: updateData,
      include: {
        rank: true,
        unit: true,
      },
    });

    await this.prisma.journalEntry.create({
      data: {
        type: 'SYSTEM',
        action: 'SERVICE_MEMBER_UPDATED',
        patientId: updated.id,
        userId,
        metadata: {
          memberId: updated.id,
          changes: Object.keys(dto),
        },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.serviceMember.findUnique({
      where: { id },
      include: { episodes: true },
    });

    if (!existing) {
      throw new NotFoundException(`ServiceMember with ID ${id} not found`);
    }

    if (existing.episodes.length > 0) {
      throw new BadRequestException(
        'Cannot delete service member with existing episodes. Delete episodes first.',
      );
    }

    await this.prisma.serviceMember.delete({
      where: { id },
    });

    await this.prisma.journalEntry.create({
      data: {
        type: 'SYSTEM',
        action: 'SERVICE_MEMBER_DELETED',
        userId,
        metadata: {
          memberId: id,
          name: `${existing.lastName} ${existing.firstName} ${existing.middleName}`,
        },
      },
    });

    return { success: true, id };
  }

  normalizeFullName(lastName: string, firstName: string, middleName: string): string {
    return `${lastName} ${firstName} ${middleName}`
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  async findByNormalizedName(lastName: string, firstName: string, middleName: string) {
    const normalized = this.normalizeFullName(lastName, firstName, middleName);
    
    const members = await this.prisma.serviceMember.findMany({
      where: {
        AND: [
          { lastName: { equals: lastName, mode: 'insensitive' as any } },
          { firstName: { equals: firstName, mode: 'insensitive' as any } },
          { middleName: { equals: middleName, mode: 'insensitive' as any } },
        ],
      },
    });

    return members;
  }
}
