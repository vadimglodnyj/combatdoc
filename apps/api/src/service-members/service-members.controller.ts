import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceMembersService } from './service-members.service';
import { ImportService } from './import.service';
import { CreateServiceMemberDto } from './dto/create-service-member.dto';
import { UpdateServiceMemberDto } from './dto/update-service-member.dto';
import { ImportApplyRequest } from './dto/import-preview.dto';

@Controller('service-members')
@UseGuards(JwtAuthGuard)
export class ServiceMembersController {
  constructor(
    private serviceMembersService: ServiceMembersService,
    private importService: ImportService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.serviceMembersService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceMembersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateServiceMemberDto, @Request() req: any) {
    return this.serviceMembersService.create(dto, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceMemberDto, @Request() req: any) {
    return this.serviceMembersService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.serviceMembersService.remove(id, req.user.id);
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async importPreview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed');
    }

    return this.importService.previewImport(file.buffer);
  }

  @Post('import/apply')
  async importApply(@Body() dto: ImportApplyRequest, @Request() req: any) {
    return this.importService.applyImport(dto, req.user.id);
  }
}
