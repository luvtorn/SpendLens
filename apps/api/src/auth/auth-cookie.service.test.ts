import { describe, expect, it } from "vitest";
import { AuthCookieService, type CookieResponse } from "@/auth/auth-cookie.service";
import { AUTH_COOKIE_NAMES } from "@/common/cookies";
import { EnvironmentService } from "@/config/environment.service";

function environment(): EnvironmentService {
  process.env.DATABASE_URL = "postgresql://spendlens:spendlens@localhost:5432/spendlens";
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.JWT_ACCESS_SECRET = "cookie-access-secret-with-more-than-32-characters";
  process.env.JWT_REFRESH_SECRET = "cookie-refresh-secret-with-more-than-32-characters";
  process.env.JWT_ACCESS_EXPIRES_IN = "15m";
  process.env.JWT_REFRESH_EXPIRES_IN = "30d";
  process.env.CSRF_SECRET = "cookie-csrf-secret-with-more-than-32-characters";
  process.env.COOKIE_SAME_SITE = "lax";
  process.env.COOKIE_SECURE = "false";
  return new EnvironmentService();
}

describe("authentication cookies", () => {
  it("sets HttpOnly session cookies and clears both on logout", () => {
    const set: Array<{ name: string; httpOnly: boolean | undefined }> = [];
    const cleared: string[] = [];
    const response: CookieResponse = {
      cookie: (name, _value, options) => set.push({ name, httpOnly: options.httpOnly }),
      clearCookie: (name) => cleared.push(name),
    };
    const cookies = new AuthCookieService(environment());
    cookies.setSession(response, {
      accessToken: "access", refreshToken: "refresh", accessMaxAgeMs: 1_000, refreshMaxAgeMs: 2_000,
    });
    cookies.clearSession(response);
    expect(set).toEqual([
      { name: AUTH_COOKIE_NAMES.access, httpOnly: true },
      { name: AUTH_COOKIE_NAMES.refresh, httpOnly: true },
    ]);
    expect(cleared).toEqual([AUTH_COOKIE_NAMES.access, AUTH_COOKIE_NAMES.refresh]);
  });
});
