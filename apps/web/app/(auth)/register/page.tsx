import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return <><div className="mb-7 text-center"><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand text-lg font-black text-white">S</span><h1 className="mt-4 text-3xl font-bold tracking-tight">Create your account</h1><p className="mt-2 text-sm text-muted">Your financial data stays isolated to your authenticated account.</p></div><Card className="p-6 sm:p-7"><RegisterForm /><p className="mt-6 text-center text-sm text-muted">Already registered? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p></Card></>;
}
