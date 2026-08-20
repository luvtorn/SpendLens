import { Injectable } from "@nestjs/common";
import type { CookieOptions } from "express";
import { AUTH_COOKIE_NAMES } from "@/common/cookies";
import { EnvironmentService } from "@/config/environment.service";
import type { SessionTokens } from "@/auth/refresh-sessions.service";

@Injectable()
export class AuthCookieService {
  constructor(private readonly environment: EnvironmentService) {}

  setSession(response: CookieResponse, tokens: SessionTokens): void {
    response.cookie(AUTH_COOKIE_NAMES.access, tokens.accessToken, this.httpOnlyOptions(tokens.accessMaxAgeMs));
    response.cookie(AUTH_COOKIE_NAMES.refresh, tokens.refreshToken, this.httpOnlyOptions(tokens.refreshMaxAgeMs));
  }

  setCsrf(response: CookieResponse, token: string): void {
    response.cookie(AUTH_COOKIE_NAMES.csrf, token, {
      ...this.baseOptions(),
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1_000,
    });
  }

  clearSession(response: CookieResponse): void {
    const options = this.baseOptions();
    response.clearCookie(AUTH_COOKIE_NAMES.access, options);
    response.clearCookie(AUTH_COOKIE_NAMES.refresh, options);
  }

  private httpOnlyOptions(maxAge: number): CookieOptions {
    return { ...this.baseOptions(), httpOnly: true, maxAge };
  }

  private baseOptions(): CookieOptions {
    const { COOKIE_DOMAIN, COOKIE_SAME_SITE, COOKIE_SECURE } = this.environment.values;
    return {
      path: "/",
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    };
  }
}

export type CookieResponse = {
  cookie(name: string, value: string, options: CookieOptions): unknown;
  clearCookie(name: string, options: CookieOptions): unknown;
};
