export type AnalyticsTransaction = {
  amountMinor: bigint;
  currency: string;
  merchantName: string;
  categoryName: string;
};

export type CurrencyTotal = {
  currency: string;
  amountMinor: bigint;
};

function groupMoney(
  transactions: readonly AnalyticsTransaction[],
  key: (transaction: AnalyticsTransaction) => string,
): Map<string, Map<string, bigint>> {
  const groups = new Map<string, Map<string, bigint>>();

  for (const transaction of transactions) {
    const groupName = key(transaction);
    const currencies = groups.get(groupName) ?? new Map<string, bigint>();
    currencies.set(
      transaction.currency,
      (currencies.get(transaction.currency) ?? 0n) + transaction.amountMinor,
    );
    groups.set(groupName, currencies);
  }

  return groups;
}

export function totalSpending(
  transactions: readonly AnalyticsTransaction[],
): CurrencyTotal[] {
  const totals = new Map<string, bigint>();
  for (const transaction of transactions) {
    totals.set(
      transaction.currency,
      (totals.get(transaction.currency) ?? 0n) + transaction.amountMinor,
    );
  }
  return [...totals].map(([currency, amountMinor]) => ({ currency, amountMinor }));
}

export function spendingByMerchant(transactions: readonly AnalyticsTransaction[]) {
  return groupMoney(transactions, (transaction) => transaction.merchantName);
}

export function spendingByCategory(transactions: readonly AnalyticsTransaction[]) {
  return groupMoney(transactions, (transaction) => transaction.categoryName);
}

export function transactionCount(transactions: readonly AnalyticsTransaction[]): number {
  return transactions.length;
}

export function matchedReceiptCount(statuses: readonly string[]): number {
  return statuses.filter((status) => status === "Matched").length;
}

export function unmatchedReceiptCount(statuses: readonly string[]): number {
  return statuses.filter((status) => status === "Unmatched").length;
}
