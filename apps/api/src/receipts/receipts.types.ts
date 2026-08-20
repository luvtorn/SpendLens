export type ReceiptResponse = {
  id: string;
  merchant: string;
  date: string;
  money: { amount: string; currency: string };
  processingStatus: "Uploaded" | "Processing" | "Processed" | "Failed";
  matchStatus: "Matched" | "Needs review" | "Unmatched";
};
