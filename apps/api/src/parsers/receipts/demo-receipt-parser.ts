import {
  parsedReceiptSchema,
  type ParsedReceipt,
  type ReceiptParser,
} from "@/parsers/receipts/receipt-parser";

export class DemoReceiptParser implements ReceiptParser {
  parse(input: unknown): Promise<ParsedReceipt> {
    return Promise.resolve(parsedReceiptSchema.parse(input));
  }
}
