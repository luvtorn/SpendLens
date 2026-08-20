import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { TokenService } from "@/auth/token.service";
import { IS_PUBLIC_ROUTE } from "@/auth/public.decorator";
import type { CurrentUser } from "@/auth/auth.types";
import { AUTH_COOKIE_NAMES, parseCookieHeader } from "@/common/cookies";

type AuthenticatedRequest = Request & { user?: CurrentUser };

export async function currentUserFromCookie(
  tokens: Pick<TokenService, "verifyAccess">,
  cookieHeader: string | undefined,
): Promise<CurrentUser> {
  const token = parseCookieHeader(cookieHeader)[AUTH_COOKIE_NAMES.access];
  if (!token) throw new UnauthorizedException("Unauthorized");
  const payload = await tokens.verifyAccess(token);
  return { id: payload.sub };
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = await currentUserFromCookie(this.tokens, request.headers.cookie);
    return true;
  }
}
