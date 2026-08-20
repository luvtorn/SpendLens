import { describe, expect, it } from "vitest";
import { parseEnvironment } from "@/config/environment";

const validEnvironment = {
  DATABASE_URL: "postgresql://spendlens:spendlens@localhost:5432/spendlens",
  PORT: "3001",
  FRONTEND_URL: "https://spendlens.example.com",
  JWT_ACCESS_SECRET: "access-secret-with-at-least-32-characters",
  JWT_REFRESH_SECRET: "refresh-secret-with-at-least-32-characters",
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "30d",
  CSRF_SECRET: "csrf-secret-with-at-least-32-characters",
  COOKIE_SAME_SITE: "lax",
  COOKIE_SECURE: "false",
};

describe("API environment", () => {
  it("supports separately deployed HTTPS frontend and PostgreSQL", () => {
    expect(parseEnvironment(validEnvironment)).toEqual({
      DATABASE_URL: validEnvironment.DATABASE_URL,
      PORT: 3001,
      FRONTEND_URL: [validEnvironment.FRONTEND_URL],
      JWT_ACCESS_SECRET: validEnvironment.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validEnvironment.JWT_REFRESH_SECRET,
      JWT_ACCESS_EXPIRES_IN: validEnvironment.JWT_ACCESS_EXPIRES_IN,
      JWT_REFRESH_EXPIRES_IN: validEnvironment.JWT_REFRESH_EXPIRES_IN,
      CSRF_SECRET: validEnvironment.CSRF_SECRET,
      COOKIE_SAME_SITE: validEnvironment.COOKIE_SAME_SITE,
      COOKIE_SECURE: false,
    });
  });

  it("rejects wildcard or path-based CORS origins", () => {
    expect(() => parseEnvironment({ ...validEnvironment, FRONTEND_URL: "*" })).toThrow("Invalid API environment configuration");
    expect(() => parseEnvironment({ ...validEnvironment, FRONTEND_URL: "https://spendlens.example.com/app" })).toThrow("Invalid API environment configuration");
  });
});
