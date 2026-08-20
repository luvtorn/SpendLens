export type CurrencyCode = string;

export type Money = {
  amountMinor: bigint;
  currency: CurrencyCode;
};

export type MerchantIdentity = {
  merchantId?: string;
  merchantRaw: string;
};

export type MatchableReceipt = MerchantIdentity & {
  id: string;
  receiptDate: string;
  totalMinor: bigint;
  currency: CurrencyCode;
};

export type MatchableTransaction = MerchantIdentity & {
  id: string;
  transactionDate: string;
  postingDate?: string;
  amountMinor: bigint;
  currency: CurrencyCode;
};

export type MatchStatus = "AUTO_MATCHED" | "PENDING_REVIEW";

export type MatchCandidate = {
  transactionId: string;
  score: number;
  amountScore: number;
  dateScore: number;
  merchantScore: number;
};

export type MatchRecommendation = {
  candidate: MatchCandidate;
  status: MatchStatus;
};
