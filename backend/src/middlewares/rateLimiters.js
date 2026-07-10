import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Login is user-initiated — keep it tight to slow credential-stuffing/brute force.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Refresh is fired automatically by the client when the 15-min access token
// expires, so it gets its own, more forgiving budget — kept separate from login
// on purpose so a transient client-side retry loop can never exhaust the login
// budget and lock a user out of the one path that recovers a broken session.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
