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
/** `inStock: true` on all three: the homepage is a shop window, and a sold-out
 * car in it wastes the best slots on the site — a visitor taps through, finds
 * they cannot buy, and that is the first impression. The backend resolves this
 * against AVAILABLE stock (stock − reservedStock), the same rule ProductCard
 * uses to print "Out of stock", so a fully-reserved item drops out too.
 *
 * Note this can legitimately return FEWER than `limit` items, and an empty list
 * when everything in a section is sold out — ProductCarousel and
 * FeaturedSpotlight both render nothing at all in that case rather than a
 * heading over an empty row. The shop page is unaffected; it still lists
 * sold-out items, sunk to the bottom via `soldOutLast`. */
export const HOME_PRODUCT_QUERIES = {
  collectorPicks: { hero: true, inStock: true, limit: 8 },
  newArrivals: { newArrival: true, inStock: true, limit: 8, sort: "newest" },
  featured: { featured: true, inStock: true, limit: 4 },
};
