export function formatMoney(amount: string, currency: string): string {
  const match = /^(-?)(\d+)\.(\d{2})$/u.exec(amount);
  if (!match) return "—";
  const [, sign, major, minor] = match;
  const amountMinor = BigInt(`${major}${minor}`) * (sign === "-" ? -1n : 1n);
  const isNegative = amountMinor < 0n;
  const absolute = isNegative ? -amountMinor : amountMinor;
  const integer = new Intl.NumberFormat("pl-PL").format(absolute / 100n);
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const currencyFormatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
  });
  const currencySymbol = currencyFormatter
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? currency;
  const formatted = `${integer},${fraction}\u00a0${currencySymbol}`;
  return isNegative ? `−${formatted}` : formatted;
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: options?.year,
    ...options,
  }).format(new Date(year, month - 1, day));
}
