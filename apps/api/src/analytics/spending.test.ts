import { describe, expect, it } from "vitest";
import { spendingByCategory, totalSpending } from "@/analytics/spending";

const transactions = [
  { amountMinor: 1010n, currency: "PLN", merchantName: "A", categoryName: "Food" },
  { amountMinor: 2020n, currency: "PLN", merchantName: "B", categoryName: "Food" },
  { amountMinor: 500n, currency: "EUR", merchantName: "A", categoryName: "Travel" },
];

describe("deterministic spending analytics", () => {
  it("adds integer minor units without floating-point arithmetic", () => {
    expect(totalSpending(transactions)).toEqual([
      { currency: "PLN", amountMinor: 3030n },
      { currency: "EUR", amountMinor: 500n },
    ]);
  });

  it("never combines totals in different currencies", () => {
    const categories = spendingByCategory(transactions);
    expect(categories.get("Food")?.get("PLN")).toBe(3030n);
    expect(categories.get("Travel")?.get("EUR")).toBe(500n);
  });
});
