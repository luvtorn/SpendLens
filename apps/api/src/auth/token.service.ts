import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { z } from "zod";
import { EnvironmentService } from "@/config/environment.service";

const accessPayloadSchema = z.object({ sub: z.string().min(1) });
const refreshPayloadSchema = accessPayloadSchema.extend({ sid: z.uuid() });

function durationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/u.exec(value);
  if (!match?.[1] || !match[2]) throw new Error("Invalid token duration");
  const units: Readonly<Record<string, number>> = { s: 1, m: 60, h: 3_600, d: 86_400 };
  const multiplier = units[match[2]];
  if (!multiplier) throw new Error("Invalid token duration");
  return Number(match[1]) * multiplier;
}

@Injectable()
export class TokenService {
  readonly accessExpiresInSeconds: number;
  readonly refreshExpiresInSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly environment: EnvironmentService,
  ) {
    this.accessExpiresInSeconds = durationSeconds(environment.values.JWT_ACCESS_EXPIRES_IN);
    this.refreshExpiresInSeconds = durationSeconds(environment.values.JWT_REFRESH_EXPIRES_IN);
  }

  signAccess(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId }, {
      secret: this.environment.values.JWT_ACCESS_SECRET,
      expiresIn: this.accessExpiresInSeconds,
    });
  }

  signRefresh(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId, sid: sessionId }, {
      secret: this.environment.values.JWT_REFRESH_SECRET,
      expiresIn: this.refreshExpiresInSeconds,
    });
  }

  async verifyAccess(token: string): Promise<{ sub: string }> {
    try {
      const payload: unknown = await this.jwt.verifyAsync(token, {
        secret: this.environment.values.JWT_ACCESS_SECRET,
      });
      return accessPayloadSchema.parse(payload);
    } catch {
      throw new UnauthorizedException("Unauthorized");
    }
  }

  async verifyRefresh(token: string): Promise<{ sub: string; sid: string }> {
    try {
      const payload: unknown = await this.jwt.verifyAsync(token, {
        secret: this.environment.values.JWT_REFRESH_SECRET,
      });
      return refreshPayloadSchema.parse(payload);
    } catch {
      throw new UnauthorizedException("Invalid refresh session");
    }
  }
}
