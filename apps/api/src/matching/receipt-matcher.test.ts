import { describe, expect, it } from "vitest";
import { createMerchantAliasLookup } from "@/merchants/normalize-merchant";
import { matchReceipt, scoreCandidate, scoreDate } from "@/matching/receipt-matcher";
import type { MatchableReceipt, MatchableTransaction } from "@/types/domain";

const aliases = createMerchantAliasLookup([
  { merchantId: "biedronka", value: "Biedronka" },
  { merchantId: "biedronka", value: "JERONIMO MARTINS POLSKA" },
]);

const receipt: MatchableReceipt = {
  id: "receipt-1", receiptDate: "2026-08-15", totalMinor: 8437n,
  currency: "PLN", merchantRaw: "Biedronka", merchantId: "biedronka",
};

function transaction(overrides: Partial<MatchableTransaction> = {}): MatchableTransaction {
  return {
    id: "transaction-1", transactionDate: "2026-08-15", amountMinor: 8437n,
    currency: "PLN", merchantRaw: "Biedronka", merchantId: "biedronka", ...overrides,
  };
}

describe("receipt matching", () => {
  it("auto-matches equal amount, date, and merchant", () => {
    const result = matchReceipt(receipt, [transaction()], aliases);
    expect(result.recommendation?.candidate.score).toBe(1);
    expect(result.recommendation?.status).toBe("AUTO_MATCHED");
  });

  it("matches a merchant through an alias", () => {
    const aliasTransaction = transaction({ merchantRaw: "JERONIMO MARTINS POLSKA S.A." });
    delete aliasTransaction.merchantId;
    const candidate = scoreCandidate(receipt, aliasTransaction, aliases);
    expect(candidate.merchantScore).toBe(1);
  });

  it("scores a one-day date difference highly", () => {
    const candidate = scoreCandidate(receipt, transaction({ transactionDate: "2026-08-14" }), aliases);
    expect(candidate.dateScore).toBe(0.85);
    expect(candidate.score).toBe(0.9625);
  });

  it("uses posting date when it is closer to the receipt date", () => {
    expect(scoreDate("2026-08-15", "2026-08-12", "2026-08-15")).toBe(1);
  });

  it("rejects a materially different amount", () => {
    expect(matchReceipt(receipt, [transaction({ amountMinor: 9900n })], aliases).recommendation).toBeUndefined();
  });

  it("does not match different currencies", () => {
    const candidate = scoreCandidate(receipt, transaction({ currency: "EUR" }), aliases);
    expect(candidate.amountScore).toBe(0);
    expect(matchReceipt(receipt, [transaction({ currency: "EUR" })], aliases).recommendation).toBeUndefined();
  });

  it("keeps same-amount transactions from different merchants for review only", () => {
    const result = matchReceipt(receipt, [transaction({ merchantId: "rossmann", merchantRaw: "Rossmann" })], aliases);
    expect(result.recommendation?.status).toBe("PENDING_REVIEW");
    expect(result.recommendation?.candidate.merchantScore).toBe(0);
  });

  it("marks two equally strong candidates as ambiguous", () => {
    const result = matchReceipt(receipt, [transaction({ id: "a" }), transaction({ id: "b" })], aliases);
    expect(result.candidates).toHaveLength(2);
    expect(result.recommendation?.status).toBe("PENDING_REVIEW");
  });

  it("creates no candidate below the review threshold", () => {
    const result = matchReceipt(receipt, [transaction({ amountMinor: 1n, merchantId: "other", merchantRaw: "Other", transactionDate: "2026-07-01" })], aliases);
    expect(result).toEqual({ candidates: [] });
  });

  it("sorts multiple candidates by descending confidence", () => {
    const result = matchReceipt(receipt, [
      transaction({ id: "lower", merchantId: "other", merchantRaw: "Other" }),
      transaction({ id: "best" }),
    ], aliases);
    expect(result.candidates.map((candidate) => candidate.transactionId)).toEqual(["best", "lower"]);
    expect(result.recommendation?.status).toBe("AUTO_MATCHED");
  });
});
