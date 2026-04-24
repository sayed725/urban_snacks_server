import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.string().transform(Number),

  APP_ORIGIN: z.string().url(),
  PROD_APP_ORIGIN: z.string().url(),

  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(10),
  BETTER_AUTH_URL: z.string().url(),

  APP_ADMIN: z.string().min(3),
  APP_ADMIN_EMAIL: z.string().email(),
  APP_ADMIN_PASS: z.string().min(8),

  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  SSL_STORE_ID: z.string(),
  SSL_STORE_PASSWD: z.string(),
  SSL_IS_SANDBOX: z.string().transform((v) => v === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
