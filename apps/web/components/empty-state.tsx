export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted">{message}</div>;
}
