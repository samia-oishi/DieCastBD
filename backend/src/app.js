import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env, isProduction, allowedOrigins } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { sanitizeInput } from "./middlewares/sanitize.js";
import { apiLimiter } from "./middlewares/rateLimiters.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { sendSuccess } from "./utils/apiResponse.js";
import { getSitemap } from "./modules/sitemap/sitemap.controller.js";
import router from "./routes/index.js";

export const app = express();

// Render/Railway put a single reverse proxy in front of the app. Trust exactly
// one hop so (a) `secure` cookies are actually set (Express otherwise sees the
// internal HTTP hop and refuses them, breaking login), and (b) express-rate-limit
// keys off the real client IP via X-Forwarded-For instead of the proxy's IP.
// Deliberately `1`, not `true`: trusting all hops would let a client spoof
// X-Forwarded-For to dodge IP rate limiting.
if (isProduction) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(sanitizeInput);
app.use("/api", apiLimiter);

app.get("/health", (req, res) => sendSuccess(res, { data: { uptime: process.uptime() } }));

// On Vercel the Express app itself is the serverless handler (Vercel's runtime
// auto-detects the exported Express server), so requests never pass through
// src/server.js — the one place that calls connectDB(). Ensure the cached
// connection is live before any DB-backed route runs. Gated to Vercel (the
// VERCEL env var is always set there) so local dev and tests, which manage
// their own connection lifecycle, are untouched. Placed after /health so the
// health check stays answerable even when the database is unreachable.
if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  });
}

// Served at the root (not under /api/v1) so it can sit at diecastbd.com/sitemap.xml
// via a Vercel rewrite — search engines expect the sitemap at the site root.
app.get("/sitemap.xml", getSitemap);

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(errorHandler);

// Default export so Vercel's runtime can use the Express app directly as the
// serverless handler (its "default export must be a function or server" check).
// The named `app` export above is still what src/server.js and tests import.
export default app;
