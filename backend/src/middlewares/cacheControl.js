// Public, read-mostly catalog data (products/categories/brands/settings) doesn't
// need a fresh DB round trip on every request — a short max-age plus
// stale-while-revalidate lets browsers/CDN edges reuse a recent response while
// a new one refreshes in the background. Mirrors the same header the sitemap
// route already sets (sitemap.controller.js), just parameterized per-route.
export const cacheControl = (seconds) => (req, res, next) => {
  res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${Math.floor(seconds / 2)}`);
  next();
};

/** Cache at the CDN edge but never in the browser.
 *
 * For a response that must look instant to whoever just changed it, while still
 * costing one serverless invocation per `edgeSeconds` instead of one per
 * request. `max-age=0, must-revalidate` keeps browsers out of it — a stale
 * BROWSER cache is what once made a saved setting appear to revert in the admin
 * — while `s-maxage` lets Vercel's edge answer for everyone else.
 *
 * Use this, not `cacheControl(n)`, for anything an admin edits and immediately
 * looks at. Use `cacheControl(n)` when a stale browser copy is harmless.
 */
export const edgeCacheControl = (edgeSeconds, staleSeconds = edgeSeconds * 2) => (req, res, next) => {
  res.set(
    "Cache-Control",
    `public, max-age=0, must-revalidate, s-maxage=${edgeSeconds}, stale-while-revalidate=${staleSeconds}`
  );
  next();
};
