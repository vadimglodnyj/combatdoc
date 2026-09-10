import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CareSegmentsService } from './care-segments.service';
import { ListClinicalQueryDto } from '../consultations/dto/list-clinical-query.dto';
import {
  CloseCareSegmentDto,
  CreateCareSegmentDto,
  DispatchCareSegmentDto,
  ProlongCareSegmentDto,
  TransitionCareSegmentDto,
  UpdateCareSegmentDto,
} from './dto/care-segment.dto';

@Controller('care-segments')
@UseGuards(JwtAuthGuard)
export class CareSegmentsController {
  constructor(private readonly careSegmentsService: CareSegmentsService) {}

  @Get()
  findAll(@Query() query: ListClinicalQueryDto) {
    return this.careSegmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.careSegmentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCareSegmentDto, @Request() req: any) {
    return this.careSegmentsService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCareSegmentDto, @Request() req: any) {
    return this.careSegmentsService.update(id, dto, req.user.id);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseCareSegmentDto, @Request() req: any) {
    return this.careSegmentsService.close(id, dto, req.user.id);
  }

  @Post(':id/prolong')
  prolong(@Param('id') id: string, @Body() dto: ProlongCareSegmentDto, @Request() req: any) {
    return this.careSegmentsService.prolong(id, dto, req.user.id);
  }

  @Post(':id/transition')
  transition(
    @Param('id') id: string,
    @Body() dto: TransitionCareSegmentDto,
    @Request() req: any,
  ) {
    return this.careSegmentsService.transition(id, dto, req.user.id);
  }

  @Post(':id/dispatch')
  dispatch(
    @Param('id') id: string,
    @Body() body: DispatchCareSegmentDto,
    @Request() req: any,
  ) {
    return this.careSegmentsService.dispatch(id, body?.chats || [], req.user.id);
  }
}
