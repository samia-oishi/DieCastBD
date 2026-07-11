import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_URL: z.string().min(1, "CLIENT_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters"),

  // Shared secret for the Vercel Cron HTTP endpoints (/api/v1/cron/*). Vercel sends
  // it as `Authorization: Bearer <CRON_SECRET>`. Optional so local/self-hosted runs
  // (which use node-cron instead) aren't forced to set it; required in production
  // for the cron endpoints to be reachable.
  CRON_SECRET: z.string().optional(),

  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, "FIREBASE_CLIENT_EMAIL is required"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),

  // Comma-separated emails auto-promoted to role "admin" on first sign-in — bootstraps the first admin
  // account without a manual DB edit. Existing users are not retroactively affected.
  ADMIN_EMAILS: z
    .string()
    .optional()
    .default("")
    .transform((val) =>
      val
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    ),

  // Cloudinary is not wired until Phase 3 (product images) — optional for now so earlier phases aren't blocked on it.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Resend is not wired until Phase 8 (order emails) — optional for now so earlier phases aren't blocked on it.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.union([z.string().email("EMAIL_FROM must be a valid email"), z.literal("")]).optional(),

  // bKash is not wired until Phase 8 (checkout) — optional for now so earlier phases aren't blocked on it.
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_BASE_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid or missing environment variables:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
