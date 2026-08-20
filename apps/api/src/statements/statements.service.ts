import { Injectable } from "@nestjs/common";
import type { DocumentStatus } from "@prisma/client";
import { serializeDateOnly } from "@/common/date";
import { PrismaService } from "@/prisma/prisma.service";
import type { StatementResponse } from "@/statements/statements.types";

const statusLabels: Record<DocumentStatus, StatementResponse["status"]> = {
  UPLOADED: "Uploaded", PROCESSING: "Processing", PROCESSED: "Processed", FAILED: "Failed",
};

@Injectable()
export class StatementsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<StatementResponse[]> {
    const statements = await this.prisma.statement.findMany({
      where: { userId },
      orderBy: { periodFrom: "desc" },
      select: {
        id: true, periodFrom: true, periodTo: true, status: true, createdAt: true,
        bankAccount: { select: { name: true, bankName: true } },
        _count: { select: { transactions: true } },
      },
    });

    return statements.map((statement) => ({
      id: statement.id,
      bankAccount: statement.bankAccount.name,
      bankName: statement.bankAccount.bankName,
      periodFrom: serializeDateOnly(statement.periodFrom),
      periodTo: serializeDateOnly(statement.periodTo),
      transactionCount: statement._count.transactions,
      status: statusLabels[statement.status],
      createdAt: serializeDateOnly(statement.createdAt),
    }));
  }
}
