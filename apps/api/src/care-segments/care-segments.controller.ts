import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('care-segments')
@UseGuards(JwtAuthGuard)
export class CareSegmentsController {
  @Get()
  findAll() {
    return { message: 'Care segments list - to be implemented' };
  }

  @Post()
  create() {
    return { message: 'Care segment creation - to be implemented' };
  }
}
