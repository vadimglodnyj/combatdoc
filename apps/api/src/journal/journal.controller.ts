import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('journal')
@UseGuards(JwtAuthGuard)
export class JournalController {
  @Get()
  getEntries(@Query('patientId') patientId?: string) {
    return { message: 'Journal entries - to be implemented', patientId };
  }
}
