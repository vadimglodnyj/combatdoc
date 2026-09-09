import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DictionariesService } from './dictionaries.service';

@Controller('dictionaries')
@UseGuards(JwtAuthGuard)
export class DictionariesController {
  constructor(private dictionariesService: DictionariesService) {}

  @Get('ranks')
  getRanks() {
    return this.dictionariesService.getRanks();
  }

  @Get('units')
  getUnits() {
    return this.dictionariesService.getUnits();
  }

  @Get('facilities')
  getFacilities() {
    return this.dictionariesService.getFacilities();
  }

  @Get('practitioner-roles')
  getPractitionerRoles() {
    return this.dictionariesService.getPractitionerRoles();
  }
}
