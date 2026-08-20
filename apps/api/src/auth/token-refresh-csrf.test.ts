import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { describe, expect, it } from "vitest";
import { CsrfService } from "@/auth/csrf.service";
import { isValidCsrfPair } from "@/auth/csrf.guard";
import { PasswordService } from "@/auth/password.service";
import { RefreshSessionsService } from "@/auth/refresh-sessions.service";
import type { NewRefreshSession, RefreshSessionStore, RefreshSessionVerifier } from "@/auth/refresh-session.repository";
import { TokenService } from "@/auth/token.service";
import { currentUserFromCookie } from "@/auth/access-token.guard";
import { EnvironmentService } from "@/config/environment.service";

function environment(): EnvironmentService {
  process.env.DATABASE_URL = "postgresql://spendlens:spendlens@localhost:5432/spendlens";
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.JWT_ACCESS_SECRET = "test-access-secret-with-more-than-32-characters";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-more-than-32-characters";
  process.env.JWT_ACCESS_EXPIRES_IN = "15m";
  process.env.JWT_REFRESH_EXPIRES_IN = "30d";
  process.env.CSRF_SECRET = "test-csrf-secret-with-more-than-32-characters";
  process.env.COOKIE_SAME_SITE = "lax";
  process.env.COOKIE_SECURE = "false";
  return new EnvironmentService();
}

class MemoryRefreshSessionStore implements RefreshSessionStore {
  private readonly sessions = new Map<string, NewRefreshSession & { revokedAt?: Date }>();

  create(session: NewRefreshSession): Promise<void> {
    this.sessions.set(session.id, session);
    return Promise.resolve();
  }

  rotate(current: RefreshSessionVerifier, replacement: NewRefreshSession, now: Date): Promise<boolean> {
    const session = this.sessions.get(current.id);
    if (!session || session.userId !== current.userId || session.tokenHash !== current.tokenHash || session.revokedAt || session.expiresAt <= now) {
      return Promise.resolve(false);
    }
    session.revokedAt = now;
    this.sessions.set(replacement.id, replacement);
    return Promise.resolve(true);
  }

  revoke(current: RefreshSessionVerifier, now: Date): Promise<void> {
    const session = this.sessions.get(current.id);
    if (session && session.userId === current.userId && session.tokenHash === current.tokenHash && !session.revokedAt) {
      session.revokedAt = now;
    }
    return Promise.resolve();
  }
}

describe("password, access token, refresh rotation, and CSRF", () => {
  it("stores an Argon2id hash rather than a raw password", async () => {
    const passwords = new PasswordService();
    const hash = await passwords.hash("password123");
    expect(hash).not.toBe("password123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    await expect(passwords.verify(hash, "password123")).resolves.toBe(true);
  });

  it("accepts a valid access token and rejects invalid or expired tokens", async () => {
    const env = environment();
    const jwt = new JwtService();
    const tokens = new TokenService(jwt, env);
    const valid = await tokens.signAccess("user-a");
    await expect(tokens.verifyAccess(valid)).resolves.toEqual({ sub: "user-a" });
    await expect(tokens.verifyAccess("invalid")).rejects.toBeInstanceOf(UnauthorizedException);
    const expired = await jwt.signAsync({ sub: "user-a" }, { secret: env.values.JWT_ACCESS_SECRET, expiresIn: -1 });
    await expect(tokens.verifyAccess(expired)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("creates authenticated request context and rejects missing authentication", async () => {
    const tokens = new TokenService(new JwtService(), environment());
    const access = await tokens.signAccess("user-a");
    await expect(currentUserFromCookie(tokens, `spendlens_access=${access}`)).resolves.toEqual({ id: "user-a" });
    await expect(currentUserFromCookie(tokens, undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(currentUserFromCookie(tokens, "spendlens_access=invalid")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rotates a valid refresh token and rejects reuse of the old token", async () => {
    const tokens = new TokenService(new JwtService(), environment());
    const sessions = new RefreshSessionsService(new MemoryRefreshSessionStore(), tokens);
    const initial = await sessions.create("user-a");
    const rotated = await sessions.rotate(initial.refreshToken);
    expect(rotated.userId).toBe("user-a");
    expect(rotated.tokens.refreshToken).not.toBe(initial.refreshToken);
    await expect(sessions.rotate(initial.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects invalid, expired, and revoked refresh tokens", async () => {
    const env = environment();
    const jwt = new JwtService();
    const tokens = new TokenService(jwt, env);
    const sessions = new RefreshSessionsService(new MemoryRefreshSessionStore(), tokens);
    await expect(sessions.rotate("invalid")).rejects.toBeInstanceOf(UnauthorizedException);
    const expired = await jwt.signAsync(
      { sub: "user-a", sid: "6ba7b810-9dad-41d1-80b4-00c04fd430c8" },
      { secret: env.values.JWT_REFRESH_SECRET, expiresIn: -1 },
    );
    await expect(sessions.rotate(expired)).rejects.toBeInstanceOf(UnauthorizedException);
    const active = await sessions.create("user-a");
    await sessions.revoke(active.refreshToken);
    await expect(sessions.rotate(active.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("makes repeated logout revocation safe", async () => {
    const sessions = new RefreshSessionsService(
      new MemoryRefreshSessionStore(),
      new TokenService(new JwtService(), environment()),
    );
    const active = await sessions.create("user-a");
    await expect(sessions.revoke(active.refreshToken)).resolves.toBeUndefined();
    await expect(sessions.revoke(active.refreshToken)).resolves.toBeUndefined();
    await expect(sessions.revoke(undefined)).resolves.toBeUndefined();
  });

  it("accepts a valid CSRF pair and rejects missing or invalid protection", () => {
    const csrf = new CsrfService(environment());
    const token = csrf.create();
    expect(isValidCsrfPair(csrf, token, token)).toBe(true);
    expect(isValidCsrfPair(csrf, undefined, token)).toBe(false);
    expect(isValidCsrfPair(csrf, token, "invalid.token")).toBe(false);
  });
});
