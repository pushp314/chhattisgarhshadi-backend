import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8080),
  API_URL: z.string().default('http://localhost:8080'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().optional(),
  
  // JWT
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  ACCESS_TOKEN_SECRET: z.string().optional(), // Backward compatibility
  ACCESS_TOKEN_EXPIRY: z.string().optional(), // Backward compatibility
  REFRESH_TOKEN_SECRET: z.string().optional(), // Backward compatibility
  REFRESH_TOKEN_EXPIRY: z.string().optional(), // Backward compatibility
  
  // Google OAuth (Mobile - only CLIENT_ID needed)
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string().optional(), // ✅ Optional (not needed for mobile)
  GOOGLE_CALLBACK_URL: z.string().optional(),  // ✅ Optional (not needed for mobile)
  
  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  
  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  
  // MSG91
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  
  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export const config = envSchema.parse(process.env);