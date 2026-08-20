import { describe, expect, it } from "vitest";
import { createMerchantAliasLookup, findMerchantByAlias, normalizeMerchantName } from "@/merchants/normalize-merchant";

describe("normalizeMerchantName", () => {
  it("normalizes case, whitespace, punctuation, and a legal suffix", () => {
    expect(normalizeMerchantName("  Jeronimo   Martins Polska S.A. ")).toBe("JERONIMO MARTINS POLSKA");
  });

  it("preserves Polish characters and outlet numbers", () => {
    expect(normalizeMerchantName("Żabka 1829")).toBe("ŻABKA 1829");
  });

  it("does not aggressively merge distinct merchant values", () => {
    expect(normalizeMerchantName("Biedronka 1829")).not.toBe(normalizeMerchantName("Biedronka 1830"));
  });
});

describe("merchant alias lookup", () => {
  it("resolves raw bank descriptions through data-driven aliases", () => {
    const aliases = createMerchantAliasLookup([
      { merchantId: "biedronka", value: "JERONIMO MARTINS POLSKA" },
    ]);
    expect(findMerchantByAlias("Jeronimo Martins Polska S.A.", aliases)).toBe("biedronka");
  });
});
