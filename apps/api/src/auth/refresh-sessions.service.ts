import { createHash, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService } from "@/auth/token.service";
import { RefreshSessionRepository, type RefreshSessionStore } from "@/auth/refresh-session.repository";
import { Inject } from "@nestjs/common";

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
};

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class RefreshSessionsService {
  constructor(
    @Inject(RefreshSessionRepository) private readonly sessions: RefreshSessionStore,
    private readonly tokens: TokenService,
  ) {}

  async create(userId: string): Promise<SessionTokens> {
    const sessionId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccess(userId),
      this.tokens.signRefresh(userId, sessionId),
    ]);
    await this.sessions.create({
      id: sessionId,
      userId,
      tokenHash: tokenHash(refreshToken),
      expiresAt: new Date(Date.now() + this.tokens.refreshExpiresInSeconds * 1_000),
    });
    return this.toSessionTokens(accessToken, refreshToken);
  }

  async rotate(rawRefreshToken: string): Promise<{ userId: string; tokens: SessionTokens }> {
    const payload = await this.tokens.verifyRefresh(rawRefreshToken);
    const newSessionId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccess(payload.sub),
      this.tokens.signRefresh(payload.sub, newSessionId),
    ]);
    const now = new Date();

    const rotated = await this.sessions.rotate(
      { id: payload.sid, userId: payload.sub, tokenHash: tokenHash(rawRefreshToken) },
      {
        id: newSessionId,
        userId: payload.sub,
        tokenHash: tokenHash(refreshToken),
        expiresAt: new Date(now.getTime() + this.tokens.refreshExpiresInSeconds * 1_000),
      },
      now,
    );
    if (!rotated) throw new UnauthorizedException("Invalid refresh session");

    return { userId: payload.sub, tokens: this.toSessionTokens(accessToken, refreshToken) };
  }

  async revoke(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const payload = await this.tokens.verifyRefresh(rawRefreshToken);
      await this.sessions.revoke(
        { id: payload.sid, userId: payload.sub, tokenHash: tokenHash(rawRefreshToken) },
        new Date(),
      );
    } catch {
      return;
    }
  }

  private toSessionTokens(accessToken: string, refreshToken: string): SessionTokens {
    return {
      accessToken,
      refreshToken,
      accessMaxAgeMs: this.tokens.accessExpiresInSeconds * 1_000,
      refreshMaxAgeMs: this.tokens.refreshExpiresInSeconds * 1_000,
    };
  }
}
