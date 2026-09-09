import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceMembersService } from './service-members.service';

@Controller('service-members')
@UseGuards(JwtAuthGuard)
export class ServiceMembersController {
  constructor(private serviceMembersService: ServiceMembersService) {}

  @Get()
  findAll() {
    return this.serviceMembersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceMembersService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return { message: 'Service member creation - to be implemented' };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return { message: 'Service member update - to be implemented' };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { message: 'Service member deletion - to be implemented' };
  }
}
