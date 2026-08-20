export type MerchantAlias = {
  merchantId: string;
  value: string;
};

export type MerchantAliasLookup = ReadonlyMap<string, string>;

const LEGAL_SUFFIX = /(?:\s+(?:S\.?\s*A\.?|SP\.?\s*Z\.?\s*O\.?\s*O\.?))$/u;

export function normalizeMerchantName(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleUpperCase("pl-PL")
    .replace(/[.,;:|/_\\-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(LEGAL_SUFFIX, "")
    .trim();
}

export function createMerchantAliasLookup(
  aliases: readonly MerchantAlias[],
): MerchantAliasLookup {
  return new Map(
    aliases.map((alias) => [normalizeMerchantName(alias.value), alias.merchantId]),
  );
}

export function findMerchantByAlias(
  merchantRaw: string,
  aliases: MerchantAliasLookup,
): string | undefined {
  return aliases.get(normalizeMerchantName(merchantRaw));
}
