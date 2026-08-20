import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthCookieService } from "@/auth/auth-cookie.service";
import { AuthService } from "@/auth/auth.service";
import { CsrfService } from "@/auth/csrf.service";
import { CurrentUserDecorator } from "@/auth/current-user.decorator";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/auth/auth.schemas";
import type { CurrentUser, SafeUser } from "@/auth/auth.types";
import { Public } from "@/auth/public.decorator";
import { AUTH_COOKIE_NAMES, parseCookieHeader } from "@/common/cookies";
import { ZodValidationPipe } from "@/common/zod-validation.pipe";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
    private readonly csrf: CsrfService,
  ) {}

  @Public()
  @Get("csrf")
  csrfToken(@Res({ passthrough: true }) response: Response): { csrfToken: string } {
    const csrfToken = this.csrf.create();
    this.cookies.setCsrf(response, csrfToken);
    return { csrfToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SafeUser> {
    const session = await this.auth.register(input);
    this.cookies.setSession(response, session);
    return session.user;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SafeUser> {
    const session = await this.auth.login(input);
    this.cookies.setSession(response, session);
    return session.user;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<SafeUser> {
    const token = parseCookieHeader(request.headers.cookie)[AUTH_COOKIE_NAMES.refresh];
    if (!token) throw new UnauthorizedException("Invalid refresh session");
    const session = await this.auth.refresh(token);
    this.cookies.setSession(response, session);
    return session.user;
  }

  @Public()
  @HttpCode(204)
  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = parseCookieHeader(request.headers.cookie)[AUTH_COOKIE_NAMES.refresh];
    await this.auth.logout(token);
    this.cookies.clearSession(response);
  }

  @Get("me")
  me(@CurrentUserDecorator() user: CurrentUser): Promise<SafeUser> {
    return this.auth.currentUser(user.id);
  }
}
