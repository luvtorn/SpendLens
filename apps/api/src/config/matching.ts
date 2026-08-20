export const MATCHING_WEIGHTS = {
  amount: 0.5,
  date: 0.25,
  merchant: 0.25,
} as const;

export const DATE_SCORES: Readonly<Record<number, number>> = {
  0: 1,
  1: 0.85,
  2: 0.55,
};

export const AUTO_MATCH_THRESHOLD = 0.9;
export const REVIEW_MATCH_THRESHOLD = 0.65;
export const AMBIGUITY_SCORE_DELTA = 0.02;
