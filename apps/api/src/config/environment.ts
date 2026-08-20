import { z } from "zod";

function isHttpOrigin(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
}

const environmentSchema = z.object({
  DATABASE_URL: z.url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "postgresql:" || protocol === "postgres:";
  }, "DATABASE_URL must use PostgreSQL"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  FRONTEND_URL: z
    .string()
    .min(1)
    .transform((value) => value.split(",").map((origin) => origin.trim()))
    .refine(
      (origins) => origins.length > 0 && origins.every(isHttpOrigin),
      "FRONTEND_URL must contain valid comma-separated origins",
    ),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/u).default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/u).default("30d"),
  CSRF_SECRET: z.string().min(32),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  COOKIE_DOMAIN: z.string().min(1).optional(),
}).superRefine((environment, context) => {
  if (environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET) {
    context.addIssue({ code: "custom", path: ["JWT_REFRESH_SECRET"], message: "JWT secrets must differ" });
  }
  if (environment.COOKIE_SAME_SITE === "none" && !environment.COOKIE_SECURE) {
    context.addIssue({ code: "custom", path: ["COOKIE_SECURE"], message: "SameSite=None requires secure cookies" });
  }
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid API environment configuration");
  }
  return result.data;
}
