export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-md">{children}</div></main>;
}
