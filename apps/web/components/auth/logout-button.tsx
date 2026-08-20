"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth/browser-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <button type="button" disabled={pending} onClick={async () => { setPending(true); try { await logout(); } finally { router.replace("/login"); router.refresh(); setPending(false); } }} className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-50">{pending ? "Signing out…" : "Sign out"}</button>;
}
