import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
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
  ) {
    return this.certService.uploadFile(episodeId, file);
  }

  @Patch('episode/:episodeId/status')
  updateStatus(
    @Param('episodeId') episodeId: string,
    @Body() dto: UpdateCertStatusDto,
  ) {
    return this.certService.updateStatus(episodeId, dto);
  }

  @Get('missing')
  listMissing() {
    return this.certService.listMissing();
  }
}
