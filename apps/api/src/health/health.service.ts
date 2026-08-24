import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth(): { status: string } {
    return { status: "ok" };
  }

  async getDatabaseHealth(): Promise<
    { status: string } | { statusCode: number }
  > {
    try {
      throw new Error("Simulated database failure");

      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch (err) {
      throw new ServiceUnavailableException("Database is not available");
    }
  }
}
