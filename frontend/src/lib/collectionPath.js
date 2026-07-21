/** Rewrites a single-facet shop URL to its collection landing page.
 *
 *   /shop?brand=mini-gt      → /brand/mini-gt
 *   /shop?category=accessories → /category/accessories
 *   /shop?brand=x&category=y → unchanged (multi-facet is app state, not a page)
 *   anything else            → unchanged
 *
 * Why this exists: nav links, footer links and homepage shelf tiles are stored
 * in Settings as merchant data, and many point at the `?brand=` form that
 * predates the landing pages. Rewriting the merchant's saved rows would be
 * overwriting their data to fix our routing; normalising at render time gets
 * the same result — links land on the indexable page — while leaving what they
 * typed alone, and it keeps working if they add more links later.
 *
 * The filtered /shop view still canonicalises to the same destination, so the
 * two paths agree on which URL is the real one either way.
 */
export function collectionPath(url) {
  if (typeof url !== "string" || !url.startsWith("/shop?")) return url;

  const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
  const keys = [...params.keys()];
  if (keys.length !== 1) return url;

  const [key] = keys;
  const value = params.get(key);
  if (!value) return url;
  if (key === "brand") return `/brand/${value}`;
  if (key === "category") return `/category/${value}`;
  return url;
}
