export const AUTH_COOKIE_NAMES = {
  access: "spendlens_access",
  refresh: "spendlens_refresh",
  csrf: "spendlens_csrf",
} as const;

export function parseCookieHeader(header: string | undefined): Readonly<Record<string, string>> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}
