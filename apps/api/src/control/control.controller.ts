import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('control')
@UseGuards(JwtAuthGuard)
export class ControlController {
  @Get('hospitalized')
  getHospitalized() {
    return { message: 'Hospitalized patients - to be implemented' };
  }

  @Get('combat-injured')
  getCombatInjured() {
    return { message: 'Combat injured patients - to be implemented' };
  }

  @Get('outpatient')
  getOutpatient() {
    return { message: 'Outpatient schedule - to be implemented' };
  }

  @Get('vlk-queue')
  getVlkQueue() {
    return { message: 'VLK queue - to be implemented' };
  }

  @Get('long-term')
  getLongTerm() {
    return { message: 'Long-term patients (120+ days) - to be implemented' };
  }

  @Get('reminders')
  getReminders() {
    return { message: 'Reminders - to be implemented' };
  }

  @Get('certificates')
  getCertificates() {
    return { message: 'Missing injury certificates - to be implemented' };
  }
}
