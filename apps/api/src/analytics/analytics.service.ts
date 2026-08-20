import { Injectable } from "@nestjs/common";
import { decimalToMinorUnits, minorUnitsToDecimal } from "@/common/money";
import { PrismaService } from "@/prisma/prisma.service";
import { spendingByCategory, spendingByMerchant, totalSpending } from "@/analytics/spending";
import type { DashboardAnalyticsResponse, MoneyResponse } from "@/analytics/analytics.types";

function money(amountMinor: bigint, currency: string): MoneyResponse {
  return { amount: minorUnitsToDecimal(amountMinor), currency };
}

function descending(left: bigint, right: bigint): number {
  return left === right ? 0 : left > right ? -1 : 1;
}

function hasMatchedReceipt(matches: readonly { status: string }[]): boolean {
  return matches.some((match) => match.status === "AUTO_MATCHED" || match.status === "CONFIRMED");
}

function hasPendingReceipt(matches: readonly { status: string }[]): boolean {
  return !hasMatchedReceipt(matches) && matches.some((match) => match.status === "PENDING_REVIEW");
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboardForUser(userId: string): Promise<DashboardAnalyticsResponse> {
    const [transactions, receipts] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        select: {
          amount: true, currency: true, merchantRaw: true,
          merchant: { select: { name: true } }, category: { select: { name: true } },
        },
      }),
      this.prisma.receipt.findMany({
        where: { userId },
        select: { matches: { select: { status: true } } },
      }),
    ]);

    const analyticsTransactions = transactions.map((transaction) => ({
      amountMinor: decimalToMinorUnits(transaction.amount),
      currency: transaction.currency,
      merchantName: transaction.merchant?.name ?? transaction.merchantRaw,
      categoryName: transaction.category?.name ?? "Uncategorized",
    }));
    const totals = totalSpending(analyticsTransactions);
    const merchantTotals = spendingByMerchant(analyticsTransactions);
    const categoryTotals = spendingByCategory(analyticsTransactions);

    return {
      totals: totals.map((total) => money(total.amountMinor, total.currency)),
      transactionCount: transactions.length,
      merchantCount: new Set(analyticsTransactions.map((transaction) => transaction.merchantName)).size,
      receipts: {
        total: receipts.length,
        matched: receipts.filter((receipt) => hasMatchedReceipt(receipt.matches)).length,
        pending: receipts.filter((receipt) => hasPendingReceipt(receipt.matches)).length,
        unmatched: receipts.filter((receipt) => !hasMatchedReceipt(receipt.matches) && !hasPendingReceipt(receipt.matches)).length,
      },
      topMerchants: totals.map((total) => ({
        currency: total.currency,
        merchants: [...merchantTotals]
          .map(([name, currencies]) => ({ name, amountMinor: currencies.get(total.currency) ?? 0n }))
          .filter((merchant) => merchant.amountMinor !== 0n)
          .sort((left, right) => descending(left.amountMinor, right.amountMinor))
          .slice(0, 4)
          .map((merchant) => ({ name: merchant.name, money: money(merchant.amountMinor, total.currency) })),
      })),
      spendingByCategory: totals.map((total) => ({
        currency: total.currency,
        categories: [...categoryTotals]
          .map(([name, currencies]) => ({ name, amountMinor: currencies.get(total.currency) ?? 0n }))
          .filter((category) => category.amountMinor !== 0n)
          .sort((left, right) => descending(left.amountMinor, right.amountMinor))
          .map((category) => ({
            name: category.name,
            money: money(category.amountMinor, total.currency),
            shareBasisPoints: total.amountMinor === 0n ? 0 : Number((category.amountMinor * 10_000n) / total.amountMinor),
          })),
      })),
    };
  }
}
