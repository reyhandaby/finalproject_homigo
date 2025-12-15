import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { json, urlencoded } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "./config/env";
import { setupCronJobs } from "./jobs/scheduler";

// Routes
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import bookingRoutes from "./routes/bookings";
import reviewRoutes from "./routes/reviews";
import reportsRouter from "./routes/reports";
import categoriesRouter from "./routes/categories";
import facilitiesRouter from "./routes/facilities";
import roomsRouter from "./routes/rooms";
import geoRoutes from "./routes/geo";
import userRoutes from "./routes/user";
import uploadRoutes from "./routes/upload";
import seasonRatesRouter from "./routes/season-rates";
import availabilityRouter from "./routes/availability";
import tenantRoutes from "./routes/tenant";

// Prisma 7 dengan PG Adapter untuk Supabase
const connectionString = env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Disable cron jobs on Vercel serverless to avoid long-running processes
if (
  process.env.VERCEL !== "1" &&
  (process.env.NODE_ENV === "production" || process.env.ENABLE_CRON === "true")
) {
  setupCronJobs();
}

const app = express();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL || "",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
app.use(json({ limit: "2mb" }));
app.use(urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Routes
app.use("/auth", authRoutes);
app.use("/properties", propertyRoutes);
app.use("/bookings", bookingRoutes);
app.use("/reviews", reviewRoutes);
app.use("/season-rates", seasonRatesRouter);
app.use("/availability", availabilityRouter);
app.use("/reports", reportsRouter);
app.use("/categories", categoriesRouter);
app.use("/facilities", facilitiesRouter);
app.use("/users", userRoutes);
app.use("/upload", uploadRoutes);
app.use("/geo", geoRoutes);
app.use("/tenant", tenantRoutes);
app.use("/rooms", roomsRouter);
app.use("/tenant/properties", tenantRoutes);

export default app;
