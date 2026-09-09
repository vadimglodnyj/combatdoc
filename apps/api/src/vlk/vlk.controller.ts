import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vlk')
@UseGuards(JwtAuthGuard)
export class VlkController {
  @Get('decisions')
  getDecisions() {
    return { message: 'VLK decisions - to be implemented' };
  }
}
