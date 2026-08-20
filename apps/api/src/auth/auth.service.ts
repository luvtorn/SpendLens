import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PasswordService } from "@/auth/password.service";
import { RefreshSessionsService } from "@/auth/refresh-sessions.service";
import type { AuthSession, SafeUser } from "@/auth/auth.types";
import type { LoginInput, RegisterInput } from "@/auth/auth.schemas";
import { UsersService, type AuthUserRecord } from "@/users/users.service";

export type UsersPort = Pick<UsersService, "create" | "findByEmail" | "findSafeById">;
export type PasswordPort = Pick<PasswordService, "hash" | "verify">;
export type SessionsPort = Pick<RefreshSessionsService, "create" | "rotate" | "revoke">;

@Injectable()
export class AuthService {
  private readonly dummyHash: Promise<string>;

  constructor(
    @Inject(UsersService) private readonly users: UsersPort,
    @Inject(PasswordService) private readonly passwords: PasswordPort,
    @Inject(RefreshSessionsService) private readonly sessions: SessionsPort,
  ) {
    this.dummyHash = this.passwords.hash(randomBytes(32).toString("hex"));
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    if (await this.users.findByEmail(input.email)) throw new ConflictException("Email is already registered");
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({ email: input.email, name: input.name, passwordHash });
    return this.createAuthenticatedSession(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email);
    const passwordHash = user?.passwordHash ?? await this.dummyHash;
    const valid = await this.passwords.verify(passwordHash, input.password);
    if (!user || !valid) throw new UnauthorizedException("Invalid credentials");
    return this.createAuthenticatedSession(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthSession> {
    const rotated = await this.sessions.rotate(rawRefreshToken);
    const user = await this.users.findSafeById(rotated.userId);
    if (!user) throw new UnauthorizedException("Invalid refresh session");
    return { user, ...rotated.tokens };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    await this.sessions.revoke(rawRefreshToken);
  }

  async currentUser(userId: string): Promise<SafeUser> {
    const user = await this.users.findSafeById(userId);
    if (!user) throw new UnauthorizedException("Unauthorized");
    return user;
  }

  private async createAuthenticatedSession(user: AuthUserRecord): Promise<AuthSession> {
    const tokens = await this.sessions.create(user.id);
    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  }
}
