import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CareSegmentsService } from './care-segments.service';
import { ListClinicalQueryDto } from '../consultations/dto/list-clinical-query.dto';

@Controller('care-segments')
@UseGuards(JwtAuthGuard)
export class CareSegmentsController {
  constructor(private readonly careSegmentsService: CareSegmentsService) {}

  @Get()
  findAll(@Query() query: ListClinicalQueryDto) {
    return this.careSegmentsService.findAll(query);
  }
}
