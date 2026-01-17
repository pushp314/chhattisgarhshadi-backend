import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default('*'),

  // JWT - FIXED: Use correct variable names
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string().optional(), // Optional for mobile-only apps
  GOOGLE_CALLBACK_URL: z.string().optional(), // Optional for mobile-only apps

  // Cloudflare R2 Storage
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_REGION: z.string().default('auto'),
  R2_PUBLIC_URL: z.string().optional(),

  // Razorpay - Optional
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Firebase - Optional
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
});

try {
  envSchema.parse(process.env);
} catch (error) {
  console.error('Invalid environment variables:', error.errors);
  process.exit(1);
}

export const env = envSchema.parse(process.env);