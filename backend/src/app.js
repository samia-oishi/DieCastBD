import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env, isProduction } from "./config/env.js";
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
    origin: env.CLIENT_URL,
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

// Served at the root (not under /api/v1) so it can sit at diecastbd.com/sitemap.xml
// via a Vercel rewrite — search engines expect the sitemap at the site root.
app.get("/sitemap.xml", getSitemap);

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(errorHandler);
