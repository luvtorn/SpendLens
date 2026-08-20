import { z } from "zod";

const moneySchema = z.object({
  amount: z.string().regex(/^-?\d+\.\d{2}$/u),
  currency: z.string().regex(/^[A-Z]{3}$/u),
});

export const transactionSchema = z.object({
  id: z.string(), date: z.iso.date(), merchant: z.string(), merchantRaw: z.string(),
  money: moneySchema, category: z.string(),
  matchStatus: z.enum(["Matched", "Needs review", "No receipt"]),
});
export const transactionsSchema = z.array(transactionSchema);

export const receiptSchema = z.object({
  id: z.string(), merchant: z.string(), date: z.iso.date(), money: moneySchema,
  processingStatus: z.enum(["Uploaded", "Processing", "Processed", "Failed"]),
  matchStatus: z.enum(["Matched", "Needs review", "Unmatched"]),
});
export const receiptsSchema = z.array(receiptSchema);

export const statementSchema = z.object({
  id: z.string(), bankAccount: z.string(), bankName: z.string(), periodFrom: z.iso.date(),
  periodTo: z.iso.date(), transactionCount: z.number().int().nonnegative(),
  status: z.enum(["Uploaded", "Processing", "Processed", "Failed"]), createdAt: z.iso.date(),
});
export const statementsSchema = z.array(statementSchema);

export const dashboardAnalyticsSchema = z.object({
  totals: z.array(moneySchema),
  transactionCount: z.number().int().nonnegative(),
  merchantCount: z.number().int().nonnegative(),
  receipts: z.object({
    total: z.number().int().nonnegative(), matched: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(), unmatched: z.number().int().nonnegative(),
  }),
  topMerchants: z.array(z.object({
    currency: z.string().regex(/^[A-Z]{3}$/u),
    merchants: z.array(z.object({ name: z.string(), money: moneySchema })),
  })),
  spendingByCategory: z.array(z.object({
    currency: z.string().regex(/^[A-Z]{3}$/u),
    categories: z.array(z.object({
      name: z.string(), money: moneySchema,
      shareBasisPoints: z.number().int().min(0).max(10_000),
    })),
  })),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type Statement = z.infer<typeof statementSchema>;
export type DashboardAnalytics = z.infer<typeof dashboardAnalyticsSchema>;
