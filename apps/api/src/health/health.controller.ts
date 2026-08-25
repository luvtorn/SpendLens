import { Controller, Get } from "@nestjs/common";
import { Public } from "@/auth/public.decorator";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}
  @Public()
  @Get()
  getHealth(): { status: "ok" } {
    return this.healthService.getHealth();
  }

  @Public()
  @Get("ready")
  async getDatabaseHealth(): Promise<{ status: "ok" }> {
    return this.healthService.getDatabaseHealth();
  }
}
