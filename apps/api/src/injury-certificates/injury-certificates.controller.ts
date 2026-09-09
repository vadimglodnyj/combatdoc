import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjuryCertificatesService } from './injury-certificates.service';
import { UpdateCertStatusDto } from './dto/update-cert-status.dto';

@Controller('injury-certificates')
@UseGuards(JwtAuthGuard)
export class InjuryCertificatesController {
  constructor(private readonly certService: InjuryCertificatesService) {}

  @Get('episode/:episodeId')
  findByEpisode(@Param('episodeId') episodeId: string) {
    return this.certService.findByEpisode(episodeId);
  }

  @Post('episode/:episodeId/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('episodeId') episodeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.certService.uploadFile(episodeId, file, req.user.id);
  }

  @Patch('episode/:episodeId/status')
  updateStatus(
    @Param('episodeId') episodeId: string,
    @Body() dto: UpdateCertStatusDto,
    @Request() req: any,
  ) {
    return this.certService.updateStatus(episodeId, dto, req.user.id);
  }

  @Get('missing')
  listMissing() {
    return this.certService.listMissing();
  }
}
