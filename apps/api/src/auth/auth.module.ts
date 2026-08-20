import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { AccessTokenGuard } from "@/auth/access-token.guard";
import { AuthController } from "@/auth/auth.controller";
import { AuthCookieService } from "@/auth/auth-cookie.service";
import { AuthService } from "@/auth/auth.service";
import { CsrfGuard } from "@/auth/csrf.guard";
import { CsrfService } from "@/auth/csrf.service";
import { PasswordService } from "@/auth/password.service";
import { RefreshSessionsService } from "@/auth/refresh-sessions.service";
import { RefreshSessionRepository } from "@/auth/refresh-session.repository";
import { TokenService } from "@/auth/token.service";
import { UsersModule } from "@/users/users.module";

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService, AuthCookieService, CsrfService, PasswordService, RefreshSessionRepository, RefreshSessionsService, TokenService,
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
  exports: [TokenService],
})
export class AuthModule {}
