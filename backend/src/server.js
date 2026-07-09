import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { app } from "./app.js";

async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`DiecastBD API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
