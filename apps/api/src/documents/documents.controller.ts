import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  @Post('medical-characteristic')
  generateMedicalCharacteristic() {
    return { message: 'Medical characteristic generation - to be implemented' };
  }

  @Post('service-characteristic')
  generateServiceCharacteristic() {
    return { message: 'Service characteristic generation - to be implemented' };
  }

  @Post('vlk-report')
  generateVlkReport() {
    return { message: 'VLK report generation - to be implemented' };
  }
}
