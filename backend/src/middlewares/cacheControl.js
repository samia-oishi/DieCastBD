// Public, read-mostly catalog data (products/categories/brands/settings) doesn't
// need a fresh DB round trip on every request — a short max-age plus
// stale-while-revalidate lets browsers/CDN edges reuse a recent response while
// a new one refreshes in the background. Mirrors the same header the sitemap
// route already sets (sitemap.controller.js), just parameterized per-route.
export const cacheControl = (seconds) => (req, res, next) => {
  res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${Math.floor(seconds / 2)}`);
  next();
};
