import { Injectable } from "@nestjs/common";
import type { DocumentStatus, ReceiptMatchStatus } from "@prisma/client";
import { serializeDateOnly } from "@/common/date";
import { PrismaService } from "@/prisma/prisma.service";
import type { ReceiptResponse } from "@/receipts/receipts.types";

const documentStatus: Record<DocumentStatus, ReceiptResponse["processingStatus"]> = {
  UPLOADED: "Uploaded", PROCESSING: "Processing", PROCESSED: "Processed", FAILED: "Failed",
};

function receiptMatchStatus(statuses: readonly ReceiptMatchStatus[]): ReceiptResponse["matchStatus"] {
  if (statuses.some((status) => status === "AUTO_MATCHED" || status === "CONFIRMED")) return "Matched";
  if (statuses.includes("PENDING_REVIEW")) return "Needs review";
  return "Unmatched";
}

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<ReceiptResponse[]> {
    const receipts = await this.prisma.receipt.findMany({
      where: { userId },
      orderBy: [{ receiptDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, receiptDate: true, merchantRaw: true, total: true, currency: true, status: true,
        merchant: { select: { name: true } }, matches: { select: { status: true } },
      },
    });

    return receipts.map((receipt) => ({
      id: receipt.id,
      merchant: receipt.merchant?.name ?? receipt.merchantRaw,
      date: serializeDateOnly(receipt.receiptDate),
      money: { amount: receipt.total.toFixed(2), currency: receipt.currency },
      processingStatus: documentStatus[receipt.status],
      matchStatus: receiptMatchStatus(receipt.matches.map((match) => match.status)),
    }));
  }
}
