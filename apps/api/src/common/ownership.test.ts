import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsService } from "@/analytics/analytics.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ReceiptsService } from "@/receipts/receipts.service";
import { StatementsService } from "@/statements/statements.service";
import { TransactionsService } from "@/transactions/transactions.service";

const prisma = new PrismaService();

afterEach(() => vi.restoreAllMocks());

describe("ownership-scoped financial queries", () => {
  it("scopes transactions, receipts, statements, and analytics to each authenticated user", async () => {
    const transactionFind = vi.spyOn(prisma.transaction, "findMany").mockResolvedValue([]);
    const receiptFind = vi.spyOn(prisma.receipt, "findMany").mockResolvedValue([]);
    const statementFind = vi.spyOn(prisma.statement, "findMany").mockResolvedValue([]);

    await new TransactionsService(prisma).listForUser("user-a");
    await new TransactionsService(prisma).listForUser("user-b");
    await new ReceiptsService(prisma).listForUser("user-a");
    await new ReceiptsService(prisma).listForUser("user-b");
    await new StatementsService(prisma).listForUser("user-a");
    await new StatementsService(prisma).listForUser("user-b");

    expect(transactionFind.mock.calls[0]?.[0]?.where).toEqual({ userId: "user-a" });
    expect(transactionFind.mock.calls[1]?.[0]?.where).toEqual({ userId: "user-b" });
    expect(receiptFind.mock.calls[0]?.[0]?.where).toEqual({ userId: "user-a" });
    expect(receiptFind.mock.calls[1]?.[0]?.where).toEqual({ userId: "user-b" });
    expect(statementFind.mock.calls[0]?.[0]?.where).toEqual({ userId: "user-a" });
    expect(statementFind.mock.calls[1]?.[0]?.where).toEqual({ userId: "user-b" });

    transactionFind.mockClear();
    receiptFind.mockClear();
    const analytics = new AnalyticsService(prisma);
    await analytics.dashboardForUser("user-a");
    await analytics.dashboardForUser("user-b");
    expect(transactionFind.mock.calls[0]?.[0]?.where).toEqual({ userId: "user-a" });
    expect(transactionFind.mock.calls[1]?.[0]?.where).toEqual({ userId: "user-b" });
    expect(receiptFind.mock.calls[0]?.[0]?.where).toEqual({ userId: "user-a" });
    expect(receiptFind.mock.calls[1]?.[0]?.where).toEqual({ userId: "user-b" });
  });
});
