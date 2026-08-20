import { afterEach, describe, expect, it, vi } from "vitest";
import { requestWithRefresh } from "@/lib/auth/browser-client";
import { loginFormSchema, registerFormSchema, safeUserSchema } from "@/lib/auth/schemas";

afterEach(() => vi.restoreAllMocks());

describe("frontend authentication", () => {
  it("validates login and registration forms", () => {
    expect(loginFormSchema.safeParse({ email: "user@example.com", password: "password123" }).success).toBe(true);
    expect(registerFormSchema.safeParse({ name: "U", email: "invalid", password: "short" }).success).toBe(false);
  });

  it("refreshes once after 401 and retries the original request once", async () => {
    const user = { id: "user-a", email: "user@example.com", name: "User" };
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ csrfToken: "signed-csrf-token-with-enough-length" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 200 }));

    await expect(requestWithRefresh("auth/me", safeUserSchema)).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
