/** Homepage API responses baked into the HTML at build time.
 *
 * Sibling of `settings/api/settingsBootstrap.js`, which does the same job for
 * Settings. Settings alone got the shell and the hero painting immediately, but
 * every product carousel still waited on its own round trip after JS booted —
 * so the page appeared with headings and grey skeletons, and the cards' text
 * arrived a few hundred milliseconds later (measurably ~235ms on a fast
 * connection, ~415ms on fast-3G). This closes that gap: the first client render
 * already has the product data, so titles and prices paint with the shell and
 * only the images stream in.
 *
 * These are the REAL API responses, fetched by the build against the same
 * endpoints the client calls — never a re-implementation of the server's
 * filtering, which would drift the moment "featured" changed meaning.
 *
 * Present only on `/` (every other route is served the neutral app.html shell)
 * and absent in dev, where every reader returns undefined and the app behaves
 * exactly as before.
 *
 * Staleness: the payload is from build time, so a price or stock level changed
 * since the last deploy shows the old value for the fraction of a second before
 * the live refetch lands. Every consumer pairs this with
 * `initialDataUpdatedAt: 0`, which marks the data instantly stale so TanStack
 * refetches on mount and replaces it — and checkout re-validates stock and
 * price server-side regardless, so a stale card can never become a bad order.
 */
let cached;

function read() {
  if (cached !== undefined) return cached;
  cached = null;

  if (typeof document !== "undefined") {
    const el = document.getElementById("__HOME_DATA__");
    if (el?.textContent) {
      try {
        cached = JSON.parse(el.textContent);
      } catch {
        cached = null; // malformed payload must never break boot
      }
    }
  }

  return cached;
}

/** Baked `{ data, meta }` envelope for a product list, by `paramsKey(params)`. */
export function bakedProductList(key) {
  return read()?.products?.[key] ?? undefined;
}

/** Baked brand list, or undefined. */
export function bakedBrands() {
  return read()?.brands ?? undefined;
}

/** Baked category list, or undefined. */
export function bakedCategories() {
  return read()?.categories ?? undefined;
}
