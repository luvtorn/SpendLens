export default function Loading() {
  return <div aria-label="Loading" className="animate-pulse space-y-6"><div className="h-9 w-52 rounded-lg bg-slate-200" /><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-32 rounded-2xl bg-slate-200" />)}</div><div className="h-80 rounded-2xl bg-slate-200" /></div>;
}
