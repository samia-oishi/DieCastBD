// Vercel serverless entrypoint. Unlike src/server.js (used for local dev and any
// long-running host), this never calls app.listen() — Vercel invokes the exported
// handler per request. We ensure the DB is connected (cached) before delegating to
// the Express app. Scheduled jobs do NOT run here; they are driven by Vercel Cron
// hitting the /api/v1/cron/* endpoints (see vercel.json).
import { app } from "../src/app.js";
import { connectDB } from "../src/config/db.js";

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
