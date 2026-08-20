import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

const navigation = [
  { href: "/dashboard", label: "Dashboard", mark: "D" },
  { href: "/transactions", label: "Transactions", mark: "T" },
  { href: "/receipts", label: "Receipts", mark: "R" },
  { href: "/statements", label: "Statements", mark: "S" },
  { href: "/settings", label: "Settings", mark: "⚙" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]"><aside className="border-b bg-[#102c22] text-white lg:fixed lg:inset-y-0 lg:w-[248px] lg:border-b-0 lg:border-r lg:border-white/10"><div className="flex h-20 items-center px-5 lg:px-7"><Link href="/dashboard" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"><span className="grid size-9 place-items-center rounded-xl bg-[#49c78c] font-black text-[#102c22]">S</span><span className="text-lg font-bold tracking-tight">SpendLens</span></Link></div><nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-4 lg:pb-0">{navigation.map((item) => <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 lg:px-4"><span aria-hidden="true" className="grid size-6 place-items-center rounded-md bg-white/10 text-[11px] font-bold">{item.mark}</span>{item.label}</Link>)}</nav><div className="absolute bottom-6 left-4 right-4 hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 lg:block"><p className="text-xs font-semibold text-[#77dca9]">Authenticated workspace</p><p className="mt-1 text-xs leading-5 text-white/60">Financial data is isolated by your backend user context.</p><LogoutButton /></div></aside><main className="min-w-0 lg:col-start-2"><div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main></div>;
}
