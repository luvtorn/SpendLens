import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return <><div className="mb-7 text-center"><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand text-lg font-black text-white">S</span><h1 className="mt-4 text-3xl font-bold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-muted">Sign in securely to your SpendLens account.</p></div><Card className="p-6 sm:p-7"><LoginForm /><p className="mt-6 text-center text-sm text-muted">New to SpendLens? <Link href="/register" className="font-semibold text-brand hover:underline">Create an account</Link></p></Card></>;
}
