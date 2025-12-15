import dotenv from "dotenv";
dotenv.config();

export const env = {
  DATABASE_URL: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "changeme",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  API_URL: process.env.API_URL || "http://localhost:4000",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || `${process.env.API_URL || "http://localhost:4000"}/auth/google/callback`,
};
