import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { CurrentUser } from "@/auth/auth.types";

type AuthenticatedRequest = Request & { user?: CurrentUser };

export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new Error("Authenticated user context is missing");
    return request.user;
  },
);
