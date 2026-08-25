import { PrismaService } from "@/prisma/prisma.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HealthService } from "./health.service";
import { ServiceUnavailableException } from "@nestjs/common";

describe("HealthService", () => {
  let prisma: PrismaService;
  let healthService: HealthService;

  beforeEach(() => {
    prisma = new PrismaService();
    healthService = new HealthService(prisma);
  });

  it("returns ok when the database probe succeeds", async () => {
    const queryRaw = vi
      .spyOn(prisma, "$queryRaw")
      .mockResolvedValue([{ result: 1 }]);

    await expect(healthService.getDatabaseHealth()).resolves.toEqual({
      status: "ok",
    });

    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("throws ServiceUnavailableException when the database probe fails", async () => {
    const queryRaw = vi
      .spyOn(prisma, "$queryRaw")
      .mockRejectedValue(new Error("Database error"));

    await expect(healthService.getDatabaseHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
