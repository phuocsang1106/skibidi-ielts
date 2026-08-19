import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_MODEL: z.string().min(1),
  APP_URL: z.string().url()
});

export type AppEnv = z.infer<typeof envSchema>;
let cached: AppEnv | null = null;

export function env(): AppEnv {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}

export function optionalEnv() {
  return {
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "",
    APP_URL: process.env.APP_URL || "http://localhost:3000"
  };
}
