import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/overview')
  async getDashboardOverview(@Req() req: any) {
    const userId = req.user.id;
    return this.analyticsService.getDashboardOverview(userId);
  }
}
