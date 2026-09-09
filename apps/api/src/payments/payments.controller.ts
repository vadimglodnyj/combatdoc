import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  @Get('calculate')
  calculate() {
    return { message: 'Payment calculation - to be implemented' };
  }

  @Post('periods')
  createPeriod() {
    return { message: 'Payment period creation - to be implemented' };
  }
}
