// Seed the required env vars with fake-but-valid values so config/env.js passes
// its boot-time schema check when tests import modules that pull it in. Only sets
// a var if it's not already present, so a real .env (or CI secrets) still wins.
const defaults = {
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://127.0.0.1:27017/diecastbd-test",
  CLIENT_URL: "http://localhost:5173",
  JWT_ACCESS_SECRET: "test-access-secret-at-least-32-characters-long",
  JWT_REFRESH_SECRET: "test-refresh-secret-at-least-32-characters-long",
  COOKIE_SECRET: "test-cookie-secret-at-least-32-characters-long",
  FIREBASE_PROJECT_ID: "test-project",
  FIREBASE_CLIENT_EMAIL: "test@test.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: "test-key",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}
