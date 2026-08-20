import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthService, type PasswordPort, type SessionsPort, type UsersPort } from "@/auth/auth.service";
import type { AuthUserRecord } from "@/users/users.service";

const existingUser: AuthUserRecord = {
  id: "user-a", email: "user@example.com", name: "User", passwordHash: "hashed-password",
};
const sessionTokens = {
  accessToken: "access-token", refreshToken: "refresh-token",
  accessMaxAgeMs: 900_000, refreshMaxAgeMs: 2_592_000_000,
};

function setup(initialUser: AuthUserRecord | null = null) {
  let storedInput: { email: string; name: string; passwordHash: string } | undefined;
  const users: UsersPort = {
    findByEmail: (email) => Promise.resolve(initialUser?.email === email ? initialUser : null),
    findSafeById: (id) => Promise.resolve(initialUser?.id === id ? { id: initialUser.id, email: initialUser.email, name: initialUser.name } : null),
    create: (input) => {
      storedInput = input;
      return Promise.resolve({ id: "created-user", ...input });
    },
  };
  const passwords: PasswordPort = {
    hash: (password) => Promise.resolve(`hashed:${password}`),
    verify: (hash, password) => Promise.resolve(hash === `hashed:${password}` || (hash === "hashed-password" && password === "correct-password")),
  };
  let revokedToken: string | undefined;
  const sessions: SessionsPort = {
    create: () => Promise.resolve(sessionTokens),
    rotate: (token) => token === "valid-refresh"
      ? Promise.resolve({ userId: initialUser?.id ?? "missing", tokens: sessionTokens })
      : Promise.reject(new UnauthorizedException("Invalid refresh session")),
    revoke: (token) => { revokedToken = token; return Promise.resolve(); },
  };
  return {
    service: new AuthService(users, passwords, sessions),
    storedInput: () => storedInput,
    revokedToken: () => revokedToken,
  };
}

describe("AuthService registration and login", () => {
  it("registers successfully and never passes the raw password to persistence", async () => {
    const context = setup();
    const session = await context.service.register({ email: "new@example.com", password: "password123", name: "New User" });
    expect(session.user.email).toBe("new@example.com");
    expect(context.storedInput()).toEqual({ email: "new@example.com", name: "New User", passwordHash: "hashed:password123" });
    expect(context.storedInput()?.passwordHash).not.toBe("password123");
  });

  it("rejects duplicate email safely", async () => {
    await expect(setup(existingUser).service.register({ email: existingUser.email, password: "password123", name: "User" })).rejects.toBeInstanceOf(ConflictException);
  });

  it("logs in with correct credentials", async () => {
    const session = await setup(existingUser).service.login({ email: existingUser.email, password: "correct-password" });
    expect(session.user.id).toBe(existingUser.id);
  });

  it("uses the same safe error for unknown email and wrong password", async () => {
    const unknown = setup().service.login({ email: "unknown@example.com", password: "wrong" });
    const wrong = setup(existingUser).service.login({ email: existingUser.email, password: "wrong" });
    await expect(unknown).rejects.toMatchObject({ message: "Invalid credentials" });
    await expect(wrong).rejects.toMatchObject({ message: "Invalid credentials" });
  });

  it("refreshes a valid session and rejects an invalid one", async () => {
    await expect(setup(existingUser).service.refresh("valid-refresh")).resolves.toMatchObject({ user: { id: existingUser.id } });
    await expect(setup(existingUser).service.refresh("invalid-refresh")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("logs out idempotently through the session service", async () => {
    const context = setup(existingUser);
    await context.service.logout("refresh-token");
    await context.service.logout(undefined);
    expect(context.revokedToken()).toBeUndefined();
  });
});
