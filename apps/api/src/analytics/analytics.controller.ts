import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sync-status')
  async getSyncStatus(@Req() req: any) {
    const userId = req.user.id;
    return this.analyticsService.getSyncStatus(userId);
  }

  @Get('dashboard/overview')
  async getDashboardOverview(@Req() req: any) {
    const userId = req.user.id;
    return this.analyticsService.getDashboardOverview(userId);
  }

  @Get('pull-requests')
  async getPullRequests(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('state') state?: string,
  ) {
    const userId = req.user.id;
    return this.analyticsService.getPullRequests(userId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : 10,
      state,
    });
  }
}
