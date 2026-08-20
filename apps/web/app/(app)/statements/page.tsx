import { ApiErrorState } from "@/components/api-error-state";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getStatements } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Statements" };
export const dynamic = "force-dynamic";

export default async function StatementsPage() {
  let statements;
  try {
    statements = await getStatements();
  } catch {
    return <><PageHeader title="Statements" description="Private bank documents are converted into validated, structured transactions." /><ApiErrorState /></>;
  }

  return <><PageHeader title="Statements" description="Private bank documents are converted into validated, structured transactions." action={<button type="button" disabled title="Statement upload is not available in this milestone" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white opacity-50">Upload statement</button>} />{statements.length === 0 ? <EmptyState message="No statements have been imported yet." /> : <div className="space-y-4">{statements.map((statement) => <Card key={statement.id} className="overflow-hidden"><div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr] xl:items-center"><div><p className="font-semibold">{statement.bankAccount}</p><p className="mt-1 text-xs text-muted">{statement.bankName}</p></div><div><p className="text-xs font-medium text-muted">Statement period</p><p className="mt-1 text-sm">{formatDate(statement.periodFrom)} – {formatDate(statement.periodTo)}</p></div><div><p className="text-xs font-medium text-muted">Transactions</p><p className="mt-1 text-sm font-semibold">{statement.transactionCount}</p></div><div><p className="text-xs font-medium text-muted">Status</p><div className="mt-1"><Badge tone={statement.status === "Processed" ? "success" : statement.status === "Failed" ? "warning" : "neutral"}>{statement.status}</Badge></div></div><div><p className="text-xs font-medium text-muted">Imported</p><p className="mt-1 text-sm">{formatDate(statement.createdAt, { year: "numeric" })}</p></div></div></Card>)}</div>}<p className="mt-4 text-xs leading-5 text-muted">Upload is intentionally disabled in this milestone. No fake backend endpoint has been created.</p></>;
}
