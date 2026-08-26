import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 300 → 900: Google's renderer crawls in bursts from shared IPs, and each
  // page render fires several API calls — a 40-page render burst could exhaust
  // a per-IP budget of 300 mid-render, which surfaced as PageLoadError in the
  // rendered DOM and a Soft-404 verdict in Search Console (plan.md #92).
  // Public catalogue reads are cheap; login keeps its own tight limiter below.
  limit: 900,
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
