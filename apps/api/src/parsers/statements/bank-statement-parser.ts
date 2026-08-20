import { z } from "zod";

export const parsedBankTransactionSchema = z.object({
  transactionDate: z.iso.date(),
  postingDate: z.iso.date().optional(),
  merchantRaw: z.string().trim().min(1),
  descriptionRaw: z.string().trim().min(1).optional(),
  amount: z.string().regex(/^-?\d+\.\d{2}$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export type ParsedBankTransaction = z.infer<typeof parsedBankTransactionSchema>;
export type ParsedDocument = { text: string };

export interface BankStatementParser {
  canParse(input: ParsedDocument): boolean;
  parse(input: ParsedDocument): Promise<ParsedBankTransaction[]>;
}
