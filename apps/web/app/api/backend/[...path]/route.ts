import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { forwardSetCookies } from "@/lib/auth/set-cookie";

const ALLOWED_AUTH_ROUTES = new Set([
  "auth/csrf", "auth/register", "auth/login", "auth/refresh", "auth/logout", "auth/me",
]);

function backendBaseUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value || !URL.canParse(value)) return undefined;
  return value.endsWith("/") ? value : `${value}/`;
}

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const path = (await context.params).path.join("/");
  const baseUrl = backendBaseUrl();
  if (!baseUrl || !ALLOWED_AUTH_ROUTES.has(path)) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const headers = new Headers({ Accept: "application/json" });
  for (const name of ["content-type", "cookie", "x-csrf-token"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const backendResponse = await fetch(new URL(path, baseUrl), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
    });
    const response = new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: { "content-type": backendResponse.headers.get("content-type") ?? "application/json" },
    });
    forwardSetCookies(backendResponse, response);
    return response;
  } catch {
    return NextResponse.json({ message: "Authentication service unavailable" }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
