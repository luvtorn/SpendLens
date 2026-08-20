import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { CsrfService } from "@/auth/csrf.service";
import { AUTH_COOKIE_NAMES, parseCookieHeader } from "@/common/cookies";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isValidCsrfPair(
  csrf: Pick<CsrfService, "equals" | "verify">,
  cookieToken: string | undefined,
  headerToken: string | undefined,
): boolean {
  return Boolean(
    cookieToken && headerToken && csrf.equals(cookieToken, headerToken) && csrf.verify(headerToken),
  );
}

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrf: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;
    const cookieToken = parseCookieHeader(request.headers.cookie)[AUTH_COOKIE_NAMES.csrf];
    const header = request.headers["x-csrf-token"];
    const headerToken = typeof header === "string" ? header : undefined;
    if (!isValidCsrfPair(this.csrf, cookieToken, headerToken)) {
      throw new ForbiddenException("Invalid CSRF token");
    }
    return true;
  }
}
