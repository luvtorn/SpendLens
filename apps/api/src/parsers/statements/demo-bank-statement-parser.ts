import {
  parsedBankTransactionSchema,
  type BankStatementParser,
  type ParsedBankTransaction,
  type ParsedDocument,
} from "@/parsers/statements/bank-statement-parser";

export class DemoBankStatementParser implements BankStatementParser {
  canParse(input: ParsedDocument): boolean {
    return input.text.startsWith("SPENDLENS_DEMO_STATEMENT\n");
  }

  parse(input: ParsedDocument): Promise<ParsedBankTransaction[]> {
    if (!this.canParse(input)) throw new Error("Unsupported statement document");

    const rows = input.text.trim().split("\n").slice(1);
    return Promise.resolve(rows.map((row) => {
      const [transactionDate, postingDate, merchantRaw, amount, currency] =
        row.split(";");
      return parsedBankTransactionSchema.parse({
        transactionDate,
        postingDate: postingDate || undefined,
        merchantRaw,
        amount,
        currency,
      });
    }));
  }
}
