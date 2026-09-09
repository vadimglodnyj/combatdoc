import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class VlkService {
  constructor(private prisma: PrismaService) {}
}
