import { ApiErrorState } from "@/components/api-error-state";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { getDashboardAnalytics } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let analytics;
  try {
    analytics = await getDashboardAnalytics();
  } catch {
    return (
      <>
        <PageHeader title="Your spending at a glance" description="A deterministic summary calculated by the SpendLens API." />
        <ApiErrorState />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Your spending at a glance" description="A deterministic summary calculated by the SpendLens API." />
      <section aria-label="Key metrics" className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-medium text-muted">Total spending</p>
          <div className="mt-3 space-y-1">
            {analytics.totals.length > 0 ? analytics.totals.map((total) => (
              <p key={total.currency} className="text-3xl font-bold tracking-tight">{formatMoney(total.amount, total.currency)}</p>
            )) : <p className="text-3xl font-bold">—</p>}
          </div>
          <p className="mt-3 text-xs text-muted">Currencies are never combined</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-muted">Transactions</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{analytics.transactionCount}</p>
          <p className="mt-3 text-xs text-muted">Across {analytics.merchantCount} merchants</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-muted">Receipts</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{analytics.receipts.total}</p>
          <p className="mt-3 text-xs text-muted">{analytics.receipts.matched} matched · {analytics.receipts.pending} pending · {analytics.receipts.unmatched} unmatched</p>
        </Card>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6"><h2 className="font-bold">Spending by category</h2><p className="mt-1 text-sm text-muted">Calculated from structured transactions</p></div>
          <div className="space-y-7">
            {analytics.spendingByCategory.map((group) => (
              <section key={group.currency}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">{group.currency}</h3>
                <div className="space-y-5">
                  {group.categories.map((category) => (
                    <div key={category.name}>
                      <div className="mb-2 flex justify-between gap-4 text-sm"><span className="font-medium">{category.name}</span><span className="tabular-nums text-muted">{formatMoney(category.money.amount, category.money.currency)}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${category.shareBasisPoints / 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-bold">Top merchants</h2>
          <p className="mt-1 text-sm text-muted">Ranked independently per currency</p>
          <div className="mt-5 space-y-6">
            {analytics.topMerchants.map((group) => (
              <section key={group.currency}>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{group.currency}</h3>
                <ol className="divide-y">
                  {group.merchants.map((merchant, index) => (
                    <li key={merchant.name} className="flex items-center gap-3 py-4 first:pt-1"><span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-sm font-bold text-brand">{index + 1}</span><span className="min-w-0 flex-1 font-medium">{merchant.name}</span><span className="text-sm tabular-nums text-muted">{formatMoney(merchant.money.amount, merchant.money.currency)}</span></li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
