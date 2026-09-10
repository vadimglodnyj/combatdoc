import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsultationsService } from './consultations.service';
import { ListClinicalQueryDto } from './dto/list-clinical-query.dto';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  findAll(@Query() query: ListClinicalQueryDto) {
    return this.consultationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateConsultationDto, @Request() req: any) {
    return this.consultationsService.create(dto, req.user.id);
  }

  @Post('remind-planned')
  remindPlanned(@Query() query: ListClinicalQueryDto) {
    return this.consultationsService.remindPlanned(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsultationDto, @Request() req: any) {
    return this.consultationsService.update(id, dto, req.user.id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: UpdateConsultationDto, @Request() req: any) {
    return this.consultationsService.complete(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.consultationsService.cancel(id, req.user.id);
  }

  @Post(':id/dispatch')
  dispatch(@Param('id') id: string, @Request() req: any) {
    return this.consultationsService.dispatch(id, req.user.id);
  }
}
