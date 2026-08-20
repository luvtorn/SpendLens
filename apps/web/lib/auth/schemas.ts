import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export const registerFormSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(80),
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(8, "Password must contain at least 8 characters").max(128),
});

export const safeUserSchema = z.object({
  id: z.string(), email: z.email(), name: z.string().nullable(),
});

const csrfResponseSchema = z.object({ csrfToken: z.string().min(20) });
const errorResponseSchema = z.object({ message: z.string() });

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type SafeUser = z.infer<typeof safeUserSchema>;
export { csrfResponseSchema, errorResponseSchema };
