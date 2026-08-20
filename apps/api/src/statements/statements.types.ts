export type StatementResponse = {
  id: string;
  bankAccount: string;
  bankName: string;
  periodFrom: string;
  periodTo: string;
  transactionCount: number;
  status: "Uploaded" | "Processing" | "Processed" | "Failed";
  createdAt: string;
};
