import { z } from "zod";

const moneyStringSchema = z.string().regex(/^\d+\.\d{2}$/);

export const parsedReceiptSchema = z.object({
  merchant: z.string().trim().min(1),
  date: z.iso.date(),
  total: moneyStringSchema,
  currency: z.string().regex(/^[A-Z]{3}$/),
  items: z.array(
    z.object({
      name: z.string().trim().min(1),
      quantity: z.string().regex(/^\d+(?:\.\d{1,3})?$/).optional(),
      unitPrice: moneyStringSchema.optional(),
      totalPrice: moneyStringSchema,
    }),
  ),
});

export type ParsedReceiptItem = z.infer<typeof parsedReceiptSchema>["items"][number];
export type ParsedReceipt = z.infer<typeof parsedReceiptSchema>;

export interface ReceiptParser {
  parse(input: unknown): Promise<ParsedReceipt>;
}
