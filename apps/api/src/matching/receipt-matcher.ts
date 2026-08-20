import {
  AMBIGUITY_SCORE_DELTA,
  AUTO_MATCH_THRESHOLD,
  DATE_SCORES,
  MATCHING_WEIGHTS,
  REVIEW_MATCH_THRESHOLD,
} from "@/config/matching";
import {
  findMerchantByAlias,
  normalizeMerchantName,
  type MerchantAliasLookup,
} from "@/merchants/normalize-merchant";
import type {
  MatchableReceipt,
  MatchableTransaction,
  MatchCandidate,
  MatchRecommendation,
} from "@/types/domain";

const MILLISECONDS_PER_DAY = 86_400_000;

function parseDateOnly(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Financial dates must use YYYY-MM-DD format");
  }

  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

export function scoreAmount(
  receipt: MatchableReceipt,
  transaction: MatchableTransaction,
): number {
  if (receipt.currency !== transaction.currency) return 0;
  return receipt.totalMinor === transaction.amountMinor ? 1 : 0;
}

function dateDifferenceInDays(left: string, right: string): number {
  return Math.abs(parseDateOnly(left) - parseDateOnly(right)) / MILLISECONDS_PER_DAY;
}

export function scoreDate(
  receiptDate: string,
  transactionDate: string,
  postingDate?: string,
): number {
  const dates = postingDate ? [transactionDate, postingDate] : [transactionDate];
  const smallestDifference = Math.min(
    ...dates.map((date) => dateDifferenceInDays(receiptDate, date)),
  );

  return DATE_SCORES[smallestDifference] ?? 0;
}

function resolveMerchant(
  merchant: { merchantId?: string; merchantRaw: string },
  aliases: MerchantAliasLookup,
): string {
  return (
    merchant.merchantId ??
    findMerchantByAlias(merchant.merchantRaw, aliases) ??
    normalizeMerchantName(merchant.merchantRaw)
  );
}

export function scoreMerchant(
  receipt: MatchableReceipt,
  transaction: MatchableTransaction,
  aliases: MerchantAliasLookup,
): number {
  return resolveMerchant(receipt, aliases) === resolveMerchant(transaction, aliases)
    ? 1
    : 0;
}

function roundScore(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function scoreCandidate(
  receipt: MatchableReceipt,
  transaction: MatchableTransaction,
  aliases: MerchantAliasLookup,
): MatchCandidate {
  const amountScore = scoreAmount(receipt, transaction);
  const dateScore = scoreDate(
    receipt.receiptDate,
    transaction.transactionDate,
    transaction.postingDate,
  );
  const merchantScore = scoreMerchant(receipt, transaction, aliases);
  const score =
    amountScore * MATCHING_WEIGHTS.amount +
    dateScore * MATCHING_WEIGHTS.date +
    merchantScore * MATCHING_WEIGHTS.merchant;

  return {
    transactionId: transaction.id,
    score: roundScore(score),
    amountScore,
    dateScore,
    merchantScore,
  };
}

export function matchReceipt(
  receipt: MatchableReceipt,
  transactions: readonly MatchableTransaction[],
  aliases: MerchantAliasLookup,
): { candidates: MatchCandidate[]; recommendation?: MatchRecommendation } {
  const candidates = transactions
    .map((transaction) => scoreCandidate(receipt, transaction, aliases))
    .filter((candidate) => candidate.score >= REVIEW_MATCH_THRESHOLD)
    .sort((left, right) => right.score - left.score);
  const best = candidates[0];

  if (!best) return { candidates };

  const second = candidates[1];
  const isAmbiguous =
    second !== undefined && best.score - second.score <= AMBIGUITY_SCORE_DELTA;
  const status =
    best.score >= AUTO_MATCH_THRESHOLD && !isAmbiguous
      ? "AUTO_MATCHED"
      : "PENDING_REVIEW";

  return { candidates, recommendation: { candidate: best, status } };
}
