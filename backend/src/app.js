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
import router from "./routes/index.js";

export const app = express();

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

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(errorHandler);
