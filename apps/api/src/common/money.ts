import type { Prisma } from "@prisma/client";

const DECIMAL_MONEY_PATTERN = /^(-?)(\d+)\.(\d{2})$/u;

export function decimalToMinorUnits(value: Prisma.Decimal): bigint {
  const match = DECIMAL_MONEY_PATTERN.exec(value.toFixed(2));
  if (!match) throw new Error("Invalid persisted monetary value");
  const sign = match[1] ?? "";
  const major = match[2];
  const minor = match[3];
  if (!major || !minor) throw new Error("Invalid persisted monetary value");
  const amount = BigInt(major + minor);
  return sign === "-" ? -amount : amount;
}

export function minorUnitsToDecimal(amountMinor: bigint): string {
  const isNegative = amountMinor < 0n;
  const absolute = isNegative ? -amountMinor : amountMinor;
  const value = `${(absolute / 100n).toString()}.${(absolute % 100n).toString().padStart(2, "0")}`;
  return isNegative ? `-${value}` : value;
}
