import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ImportController {
  @Post('excel/preview')
  previewExcel() {
    return { message: 'Excel preview - to be implemented' };
  }

  @Post('excel/apply')
  applyExcel() {
    return { message: 'Excel import apply - to be implemented' };
  }

  @Post('turso/preview')
  previewTurso() {
    return { message: 'Turso preview - to be implemented' };
  }

  @Post('turso/apply')
  applyTurso() {
    return { message: 'Turso import apply - to be implemented' };
  }
}
