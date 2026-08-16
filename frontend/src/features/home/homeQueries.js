/** The product queries the homepage issues on first paint.
 *
 * Declared here rather than inline in HomePage because `scripts/prerender.mjs`
 * fetches exactly these at build time and bakes the responses into the HTML.
 * If the page asked for `limit: 8` and the prerender baked `limit: 12`, the
 * keys would not match and the bake would silently do nothing — the page would
 * still work, just slowly, which is the worst kind of regression to spot. One
 * definition, imported by both, makes that impossible.
 *
 * Params must be plain and serialisable: they become the payload key via
 * `paramsKey()`.
 */
export const HOME_PRODUCT_QUERIES = {
  collectorPicks: { hero: true, limit: 8 },
  newArrivals: { newArrival: true, limit: 8, sort: "newest" },
  featured: { featured: true, limit: 4 },
};
