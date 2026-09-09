import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('episodes')
@UseGuards(JwtAuthGuard)
export class EpisodesController {
  @Get()
  findAll() {
    return { message: 'Episodes list - to be implemented' };
  }

  @Post()
  create() {
    return { message: 'Episode creation - to be implemented' };
  }
}
