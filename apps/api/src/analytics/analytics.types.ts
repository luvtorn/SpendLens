export type MoneyResponse = { amount: string; currency: string };
export type DashboardAnalyticsResponse = {
  totals: MoneyResponse[];
  transactionCount: number;
  merchantCount: number;
  receipts: { total: number; matched: number; pending: number; unmatched: number };
  topMerchants: Array<{
    currency: string;
    merchants: Array<{ name: string; money: MoneyResponse }>;
  }>;
  spendingByCategory: Array<{
    currency: string;
    categories: Array<{ name: string; money: MoneyResponse; shareBasisPoints: number }>;
  }>;
};
