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

function readEl(id) {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(id);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null; // malformed payload must never break boot
  }
}

function read() {
  if (cached !== undefined) return cached;
  // __HOME_DATA__ is the homepage's carousel payload; __ROUTE_DATA__ is the
  // per-route payload every prerendered page now carries (see
  // scripts/prerender.mjs). Merged so one set of accessors serves both.
  //
  // WHY __ROUTE_DATA__ exists — the Soft-404 incident (plan.md #92): Google
  // renders JS, and when its renderer couldn't reach api.diecastbd.com the app
  // wiped the baked body and painted PageLoadError — so Google classified
  // fully-written guides as Soft 404 and refused to index them. With the
  // route's data in the HTML, the first render always has real content and a
  // failed refetch can only leave slightly stale data, never an error page.
  const home = readEl("__HOME_DATA__");
  const route = readEl("__ROUTE_DATA__");
  cached = home || route ? { home, route } : null;
  return cached;
}

/** Baked `{ data, meta }` envelope for a product list, by `paramsKey(params)`. */
export function bakedProductList(key) {
  const d = read();
  return d?.home?.products?.[key] ?? d?.route?.productLists?.[key] ?? undefined;
}

/** Baked brand list, or undefined. */
export function bakedBrands() {
  const d = read();
  return d?.route?.brands ?? d?.home?.brands ?? undefined;
}

/** Baked category list, or undefined. */
export function bakedCategories() {
  const d = read();
  return d?.route?.categories ?? d?.home?.categories ?? undefined;
}

/** Baked CMS page document for THIS route (slug-checked so client-side
 * navigation to a different page never reuses the wrong payload). */
export function bakedPage(slug) {
  const page = read()?.route?.page;
  return page?.slug === slug ? page : undefined;
}

/** Baked full product document for THIS route, slug-checked like bakedPage. */
export function bakedProduct(slug) {
  const product = read()?.route?.product;
  return product?.slug === slug ? product : undefined;
}

/** Baked published-guides list (the /collections hub payload). */
export function bakedPublishedPages() {
  return read()?.route?.publishedPages ?? undefined;
}
