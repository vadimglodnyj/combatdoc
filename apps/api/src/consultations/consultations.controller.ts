import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  @Get()
  findAll() {
    return { message: 'Consultations list - to be implemented' };
  }

  @Post()
  create() {
    return { message: 'Consultation creation - to be implemented' };
  }
}
