import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

// Cached across warm serverless invocations: on Vercel the module is reused
// between requests on a warm instance, so we hold onto the connection promise
// instead of dialing a fresh connection (and exhausting the Atlas pool) per call.
let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(env.MONGODB_URI, {
      // Keep the pool small — many concurrent serverless instances each open
      // their own pool, so a large per-instance pool multiplies fast.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    })
    .then((m) => {
      console.log(`MongoDB connected: ${m.connection.host}/${m.connection.name}`);
      return m.connection;
    })
    .catch((err) => {
      // Reset so the next invocation retries instead of caching a rejected promise.
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

export async function disconnectDB() {
  connectionPromise = null;
  await mongoose.disconnect();
}
