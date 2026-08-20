import { ApiErrorState } from "@/components/api-error-state";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getReceipts } from "@/lib/api/client";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Receipts" };
export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  let receipts;
  try {
    receipts = await getReceipts();
  } catch {
    return <><PageHeader title="Receipts" description="Item-level purchase detail linked through explainable API matching results." /><ApiErrorState /></>;
  }

  return <><PageHeader title="Receipts" description="Item-level purchase detail linked through explainable API matching results." />{receipts.length === 0 ? <EmptyState message="No receipts have been processed yet." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{receipts.map((receipt) => <Card key={receipt.id} className="p-5"><div className="flex items-start justify-between gap-4"><div className="grid size-11 place-items-center rounded-xl bg-brand-soft font-bold text-brand">{receipt.merchant.slice(0, 1)}</div><Badge tone={receipt.matchStatus === "Matched" ? "success" : receipt.matchStatus === "Needs review" ? "warning" : "neutral"}>{receipt.matchStatus}</Badge></div><h2 className="mt-5 font-bold">{receipt.merchant}</h2><p className="mt-1 text-sm text-muted">{formatDate(receipt.date, { year: "numeric" })}</p><div className="mt-5 flex items-end justify-between border-t pt-4"><span className="text-xs font-medium text-muted">{receipt.processingStatus}</span><span className="text-lg font-bold tabular-nums">{formatMoney(receipt.money.amount, receipt.money.currency)}</span></div></Card>)}</div>}</>;
}
