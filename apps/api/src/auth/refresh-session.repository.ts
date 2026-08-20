import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export type NewRefreshSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type RefreshSessionVerifier = {
  id: string;
  userId: string;
  tokenHash: string;
};

export type RefreshSessionStore = {
  create(session: NewRefreshSession): Promise<void>;
  rotate(current: RefreshSessionVerifier, replacement: NewRefreshSession, now: Date): Promise<boolean>;
  revoke(current: RefreshSessionVerifier, now: Date): Promise<void>;
};

@Injectable()
export class RefreshSessionRepository implements RefreshSessionStore {
  constructor(private readonly prisma: PrismaService) {}

  async create(session: NewRefreshSession): Promise<void> {
    await this.prisma.refreshSession.create({ data: session });
  }

  rotate(current: RefreshSessionVerifier, replacement: NewRefreshSession, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (database) => {
      const revoked = await database.refreshSession.updateMany({
        where: { ...current, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      if (revoked.count !== 1) return false;
      await database.refreshSession.create({ data: replacement });
      return true;
    });
  }

  async revoke(current: RefreshSessionVerifier, now: Date): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { ...current, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
