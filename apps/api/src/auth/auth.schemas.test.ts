import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/auth/auth.schemas";

describe("auth payload validation", () => {
  it("normalizes a valid registration email", () => {
    const result = registerSchema.parse({ email: "  User@Example.COM ", password: "password123", name: "User Name" });
    expect(result.email).toBe("user@example.com");
  });

  it("rejects invalid email and short password", () => {
    expect(registerSchema.safeParse({ email: "invalid", password: "short", name: "User" }).success).toBe(false);
  });

  it("rejects unknown login fields", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "password123", userId: "attacker" }).success).toBe(false);
  });
});
