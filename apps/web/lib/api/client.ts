import type { ZodType } from "zod";
import {
  dashboardAnalyticsSchema,
  receiptsSchema,
  statementsSchema,
  transactionsSchema,
  type DashboardAnalytics,
  type Receipt,
  type Statement,
  type Transaction,
} from "@/lib/api/schemas";

export class ApiUnavailableError extends Error {
  constructor() {
    super("SpendLens API is unavailable");
    this.name = "ApiUnavailableError";
  }
}

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value || !URL.canParse(value)) throw new ApiUnavailableError();
  return value.endsWith("/") ? value : `${value}/`;
}

async function apiRequest<T>(path: string, schema: ZodType<T>): Promise<T> {
  try {
    const cookieHeader = (await cookies()).toString();
    const response = await fetch(new URL(path, apiBaseUrl()), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json", ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
    });
    if (!response.ok) throw new ApiUnavailableError();
    const payload: unknown = await response.json();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) throw new ApiUnavailableError();
    return parsed.data;
  } catch (error: unknown) {
    if (error instanceof ApiUnavailableError) throw error;
    throw new ApiUnavailableError();
  }
}

export const getTransactions = (): Promise<Transaction[]> => apiRequest("transactions", transactionsSchema);
export const getReceipts = (): Promise<Receipt[]> => apiRequest("receipts", receiptsSchema);
export const getStatements = (): Promise<Statement[]> => apiRequest("statements", statementsSchema);
export const getDashboardAnalytics = (): Promise<DashboardAnalytics> => apiRequest("analytics/dashboard", dashboardAnalyticsSchema);
import "server-only";
import { cookies } from "next/headers";
