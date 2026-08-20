import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border bg-card shadow-[0_1px_2px_rgba(21,37,30,0.04)] ${className}`} {...props} />;
}
