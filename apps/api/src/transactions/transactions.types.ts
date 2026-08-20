export type TransactionResponse = {
  id: string;
  date: string;
  merchant: string;
  merchantRaw: string;
  money: { amount: string; currency: string };
  category: string;
  matchStatus: "Matched" | "Needs review" | "No receipt";
};
