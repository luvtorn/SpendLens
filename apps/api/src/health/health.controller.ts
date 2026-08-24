import { Controller, Get } from "@nestjs/common";
import { Public } from "@/auth/public.decorator";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}
  @Public()
  @Get()
  getHealth(): { status: string } {
    return this.healthService.getHealth();
  }

  @Public()
  @Get("ready")
  async getDatabaseHealth(): Promise<
    { status: string } | { statusCode: number }
  > {
    return this.healthService.getDatabaseHealth();
  }
}
