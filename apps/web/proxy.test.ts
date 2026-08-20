import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

afterEach(() => vi.restoreAllMocks());

describe("server-side protected routes", () => {
  it("redirects an unauthenticated protected request to login", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001/api";
    const response = await proxy(new NextRequest("http://localhost:3000/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("allows public login without an authenticated cookie", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001/api";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await proxy(new NextRequest("http://localhost:3000/login"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
