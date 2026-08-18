import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  BANK_NAME: z.string().optional().default(""),
  BANK_ACCOUNT_NUMBER: z.string().optional().default(""),
  BANK_ACCOUNT_HOLDER: z.string().optional().default(""),
  BANK_QR_IMAGE_URL: z.string().optional().default(""),
  PRO_PRICE_VND: z.coerce.number().int().positive().default(50000)
});

export const env = envSchema.parse(process.env);
