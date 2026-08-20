import { z } from "zod";

export const emailSchema = z.string().trim().pipe(z.email()).transform((email) => email.toLowerCase());
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().trim().min(2).max(80);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
