import { describe, expect, it } from "vitest";
import { transactionSchema } from "./schemas";

describe("SpendLens API contract", () => {
  const transaction = {
    id: "transaction-1",
    date: "2026-08-15",
    merchant: "Biedronka",
    merchantRaw: "JERONIMO MARTINS POLSKA S.A.",
    money: { amount: "84.37", currency: "PLN" },
    category: "Groceries",
    matchStatus: "Matched",
  };

  it("accepts exact decimal money serialized as a string", () => {
    expect(transactionSchema.safeParse(transaction).success).toBe(true);
  });

  it("rejects floating-point money from the API", () => {
    expect(transactionSchema.safeParse({
      ...transaction,
      money: { amount: 84.37, currency: "PLN" },
    }).success).toBe(false);
  });
});
