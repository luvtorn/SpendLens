import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { forwardSetCookies } from "@/lib/auth/set-cookie";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);
const ACCESS_COOKIE = "spendlens_access";
const REFRESH_COOKIE = "spendlens_refresh";
const CSRF_COOKIE = "spendlens_csrf";

function apiUrl(path: string): URL | undefined {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value || !URL.canParse(value)) return undefined;
  return new URL(path, value.endsWith("/") ? value : `${value}/`);
}

async function authenticate(request: NextRequest): Promise<"authenticated" | Response | "unauthenticated"> {
  const meUrl = apiUrl("auth/me");
  if (!meUrl) return "unauthenticated";
  const cookie = request.headers.get("cookie") ?? "";
  if (request.cookies.has(ACCESS_COOKIE)) {
    try {
      const me = await fetch(meUrl, { headers: { Cookie: cookie }, cache: "no-store" });
      if (me.ok) return "authenticated";
    } catch {
      return "unauthenticated";
    }
  }

  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const csrf = request.cookies.get(CSRF_COOKIE)?.value;
  const refreshUrl = apiUrl("auth/refresh");
  if (!refresh || !csrf || !refreshUrl) return "unauthenticated";
  try {
    const refreshed = await fetch(refreshUrl, {
      method: "POST",
      headers: { Cookie: cookie, "X-CSRF-Token": csrf, Accept: "application/json" },
      cache: "no-store",
    });
    if (!refreshed.ok) return "unauthenticated";
    return refreshed;
  } catch {
    return "unauthenticated";
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicRoute = PUBLIC_ROUTES.has(pathname);
  const authentication = await authenticate(request);

  if (authentication === "authenticated") {
    return publicRoute || pathname === "/"
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }

  if (authentication instanceof Response) {
    const destination = publicRoute || pathname === "/" ? "/dashboard" : pathname;
    const response = NextResponse.redirect(new URL(destination, request.url));
    forwardSetCookies(authentication, response);
    return response;
  }

  return publicRoute
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*", "/transactions/:path*", "/receipts/:path*", "/statements/:path*", "/settings/:path*"],
};
