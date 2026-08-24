import { Injectable } from "@nestjs/common";
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
    if (await this.prisma.$queryRaw`SELECT 1`) {
      return { status: "ok" };
    } else {
      return { statusCode: 503 };
    }
  }
}
