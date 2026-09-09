import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateCertStatusDto } from './dto/update-cert-status.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class InjuryCertificatesService {
  private readonly uploadPath = process.env.UPLOAD_PATH || './uploads/injury-certs';

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async findByEpisode(episodeId: string) {
    const cert = await this.prisma.injuryCertificate.findUnique({
      where: { episodeId },
      include: {
        episode: {
          include: {
            serviceMember: {
              include: {
                rank: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!cert) {
      throw new NotFoundException('Certificate not found for this episode');
    }

    return cert;
  }

  async uploadFile(episodeId: string, file: Express.Multer.File, userId: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      include: { injuryCertificate: true },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    if (episode.nature !== 'COMBAT') {
      throw new BadRequestException('Certificate is only required for COMBAT episodes');
    }

    // Save file
    const timestamp = Date.now();
    const filename = `${episodeId}_${timestamp}_${file.originalname}`;
    const filePath = path.join(this.uploadPath, filename);
    fs.writeFileSync(filePath, file.buffer);

    // Update or create certificate
    let cert = episode.injuryCertificate;
    if (!cert) {
      cert = await this.prisma.injuryCertificate.create({
        data: {
          episodeId,
          status: 'PENDING',
          uploadDate: new Date(),
          filePath,
        },
      });
    } else {
      cert = await this.prisma.injuryCertificate.update({
        where: { episodeId },
        data: {
          status: 'PENDING',
          uploadDate: new Date(),
          filePath,
        },
      });
    }

    // Journal entry
    await this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: episode.serviceMemberId,
        episodeId,
        userId,
        action: `Завантажено довідку №5: ${file.originalname} (статус: PENDING)`,
      },
    });

    // TODO: OCR/classification pipeline (Gemini if env set)
    // For now, just set PENDING and wait for manual verification

    return this.findByEpisode(episodeId);
  }

  async updateStatus(episodeId: string, dto: UpdateCertStatusDto, userId: string) {
    const cert = await this.prisma.injuryCertificate.findUnique({
      where: { episodeId },
      include: { episode: true },
    });

    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }

    const updated = await this.prisma.injuryCertificate.update({
      where: { episodeId },
      data: {
        status: dto.status,
        ...(dto.status === 'VERIFIED' && { verifiedDate: new Date() }),
        ...(dto.status === 'REJECTED' && {
          rejectionReason: dto.rejectionReason || 'Rejected by admin',
        }),
      },
    });

    // Journal entry
    await this.prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: cert.episode.serviceMemberId,
        episodeId,
        userId,
        action: `Довідка №5: статус змінено на ${dto.status}${dto.rejectionReason ? ` (причина: ${dto.rejectionReason})` : ''}`,
      },
    });

    // Create Task if REJECTED or MISSING
    if (dto.status === 'REJECTED' || dto.status === 'MISSING') {
      await this.prisma.task.create({
        data: {
          title: `Довідка №5 потребує уваги (Episode: ${cert.episode.diagnosis})`,
          description: dto.rejectionReason || 'Довідка відсутня або відхилена',
          status: 'TODO',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          patientId: cert.episode.serviceMemberId,
          assigneeId: null,
          createdById: userId,
        },
      });
    }

    return this.findByEpisode(episodeId);
  }

  async listMissing() {
    const episodes = await this.prisma.episode.findMany({
      where: {
        nature: 'COMBAT',
        isActive: true,
        injuryCertificate: {
          status: {
            in: ['MISSING', 'PENDING', 'REJECTED'],
          },
        },
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
      orderBy: {
        startDate: 'desc',
      },
    });

    return {
      data: episodes,
      total: episodes.length,
    };
  }
}
