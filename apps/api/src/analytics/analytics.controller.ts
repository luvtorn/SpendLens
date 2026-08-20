import { Controller, Get } from "@nestjs/common";
import { AnalyticsService } from "@/analytics/analytics.service";
import type { DashboardAnalyticsResponse } from "@/analytics/analytics.types";
import { CurrentUserDecorator } from "@/auth/current-user.decorator";
import type { CurrentUser } from "@/auth/auth.types";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  dashboard(@CurrentUserDecorator() user: CurrentUser): Promise<DashboardAnalyticsResponse> {
    return this.analyticsService.dashboardForUser(user.id);
  }
}
