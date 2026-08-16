/** Canonical string for a set of query params — "featured=true&limit=4".
 *
 * The contract between `scripts/prerender.mjs`, which bakes a homepage query's
 * response into the HTML at build time, and the hook that reads it back on the
 * client. Both sides derive the key from the same params object, so a query can
 * only match its own baked payload.
 *
 * Sorted, and empty values dropped, so `{limit: 4, featured: true}` and
 * `{featured: true, limit: 4, brand: undefined}` produce one key rather than
 * two that silently miss each other.
 */
export function paramsKey(params = {}) {
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}
