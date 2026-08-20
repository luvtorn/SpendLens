import { ApiErrorState } from "@/components/api-error-state";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTransactions } from "@/lib/api/client";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  let transactions;
  try {
    transactions = await getTransactions();
  } catch {
    return <><PageHeader title="Transactions" description="Bank statement entries remain the authoritative source for your transaction history." /><ApiErrorState /></>;
  }

  return <><PageHeader title="Transactions" description="Bank statement entries remain the authoritative source for your transaction history." />{transactions.length === 0 ? <EmptyState message="No transactions have been imported yet." /> : <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b bg-slate-50/70 text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-4 font-semibold">Date</th><th className="px-5 py-4 font-semibold">Merchant</th><th className="px-5 py-4 font-semibold">Category</th><th className="px-5 py-4 font-semibold">Receipt</th><th className="px-5 py-4 text-right font-semibold">Amount</th></tr></thead><tbody className="divide-y">{transactions.map((transaction) => <tr key={transaction.id} className="transition hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 text-muted">{formatDate(transaction.date)}</td><td className="px-5 py-4"><p className="font-semibold">{transaction.merchant}</p><p className="mt-1 max-w-xs truncate text-xs text-muted">{transaction.merchantRaw}</p></td><td className="px-5 py-4 text-muted">{transaction.category}</td><td className="px-5 py-4"><Badge tone={transaction.matchStatus === "Matched" ? "success" : transaction.matchStatus === "Needs review" ? "warning" : "neutral"}>{transaction.matchStatus}</Badge></td><td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums">{formatMoney(transaction.money.amount, transaction.money.currency)}</td></tr>)}</tbody></table></div></Card>}</>;
}
