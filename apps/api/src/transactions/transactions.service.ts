import { Injectable } from "@nestjs/common";
import type { ReceiptMatchStatus } from "@prisma/client";
import { serializeDateOnly } from "@/common/date";
import { PrismaService } from "@/prisma/prisma.service";
import type { TransactionResponse } from "@/transactions/transactions.types";

function matchStatus(statuses: readonly ReceiptMatchStatus[]): TransactionResponse["matchStatus"] {
  if (statuses.some((status) => status === "AUTO_MATCHED" || status === "CONFIRMED")) return "Matched";
  if (statuses.includes("PENDING_REVIEW")) return "Needs review";
  return "No receipt";
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<TransactionResponse[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, transactionDate: true, merchantRaw: true, amount: true, currency: true,
        merchant: { select: { name: true } }, category: { select: { name: true } },
        receiptMatches: { select: { status: true } },
      },
    });

    return transactions.map((transaction) => ({
      id: transaction.id,
      date: serializeDateOnly(transaction.transactionDate),
      merchant: transaction.merchant?.name ?? transaction.merchantRaw,
      merchantRaw: transaction.merchantRaw,
      money: { amount: transaction.amount.toFixed(2), currency: transaction.currency },
      category: transaction.category?.name ?? "Uncategorized",
      matchStatus: matchStatus(transaction.receiptMatches.map((match) => match.status)),
    }));
  }
}
