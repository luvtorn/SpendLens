"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthenticationError, login } from "@/lib/auth/browser-client";
import { loginFormSchema, type LoginFormInput } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = handleSubmit(async (input) => {
    setError(undefined);
    try {
      await login(input);
      router.replace("/dashboard");
      router.refresh();
    } catch (cause: unknown) {
      setError(cause instanceof AuthenticationError ? cause.message : "Unable to sign in");
    }
  });

  return <form onSubmit={onSubmit} className="space-y-5" noValidate><div><label htmlFor="email" className="text-sm font-semibold">Email</label><input id="email" type="email" autoComplete="email" className="mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" {...register("email")} />{errors.email && <p className="mt-1.5 text-xs text-rose-700">Enter a valid email address</p>}</div><div><label htmlFor="password" className="text-sm font-semibold">Password</label><input id="password" type="password" autoComplete="current-password" className="mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" {...register("password")} />{errors.password && <p className="mt-1.5 text-xs text-rose-700">Password is required</p>}</div>{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-[#12573f] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Signing in…" : "Sign in"}</button></form>;
}
