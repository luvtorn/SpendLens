import type { ZodType } from "zod";
import {
  csrfResponseSchema,
  errorResponseSchema,
  safeUserSchema,
  type LoginFormInput,
  type RegisterFormInput,
  type SafeUser,
} from "@/lib/auth/schemas";

let csrfToken: string | undefined;

export class AuthenticationError extends Error {
  constructor(message = "Authentication failed") {
    super(message);
    this.name = "AuthenticationError";
  }
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch("/api/backend/auth/csrf", { credentials: "include", cache: "no-store" });
  const payload: unknown = await response.json();
  const parsed = csrfResponseSchema.safeParse(payload);
  if (!response.ok || !parsed.success) throw new AuthenticationError("Unable to initialize secure request");
  csrfToken = parsed.data.csrfToken;
  return csrfToken;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    const parsed = errorResponseSchema.safeParse(payload);
    return parsed.success ? parsed.data.message : "Authentication failed";
  } catch {
    return "Authentication failed";
  }
}

async function mutate(path: string, body?: unknown): Promise<Response> {
  const token = await getCsrfToken();
  return fetch(`/api/backend/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function requestWithRefresh<T>(path: string, schema: ZodType<T>): Promise<T> {
  let response = await fetch(`/api/backend/${path}`, { credentials: "include", cache: "no-store" });
  if (response.status === 401) {
    const refreshed = await mutate("auth/refresh");
    if (!refreshed.ok) throw new AuthenticationError("Your session has expired");
    response = await fetch(`/api/backend/${path}`, { credentials: "include", cache: "no-store" });
  }
  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);
  if (!response.ok || !parsed.success) {
    const error = errorResponseSchema.safeParse(payload);
    throw new AuthenticationError(error.success ? error.data.message : "Authentication failed");
  }
  return parsed.data;
}

async function authenticate(path: "auth/login" | "auth/register", input: LoginFormInput | RegisterFormInput): Promise<SafeUser> {
  const response = await mutate(path, input);
  const payload: unknown = await response.json();
  const parsed = safeUserSchema.safeParse(payload);
  if (!response.ok || !parsed.success) {
    const error = errorResponseSchema.safeParse(payload);
    throw new AuthenticationError(error.success ? error.data.message : "Authentication failed");
  }
  return parsed.data;
}

export const login = (input: LoginFormInput) => authenticate("auth/login", input);
export const register = (input: RegisterFormInput) => authenticate("auth/register", input);

export async function logout(): Promise<void> {
  const response = await mutate("auth/logout");
  csrfToken = undefined;
  if (!response.ok && response.status !== 401) throw new AuthenticationError(await errorMessage(response));
}
