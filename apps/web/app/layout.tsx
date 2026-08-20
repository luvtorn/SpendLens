import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SpendLens", template: "%s · SpendLens" },
  description: "Clear, verifiable insight into your everyday spending.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="h-full antialiased"><body className="min-h-full">{children}</body></html>;
}
