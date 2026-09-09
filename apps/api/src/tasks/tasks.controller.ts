import { Controller, Get, Post, Put, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  @Get()
  findAll() {
    return { message: 'Tasks list - to be implemented' };
  }

  @Post()
  create() {
    return { message: 'Task creation - to be implemented' };
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string) {
    return { message: 'Task status update - to be implemented' };
  }
}
