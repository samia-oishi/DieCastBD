/** Who sees a brand or category where.
 *
 * /brands and /categories return EVERY record, because `/brand/<slug>` and
 * `/category/<slug>` are indexed landing pages that must resolve for as long as
 * the record exists — gating the list on `isActive` turned "deactivate" into
 * "delete the page", which served Google a Soft 404 (plan.md #109). The three
 * surfaces that are *navigation* narrow the list themselves, and they do it
 * here so they can't drift apart:
 *
 *   isActive          — the merchant's own switch: "offer this as a shop
 *                       filter". Honoured literally and on its own, so toggling
 *                       it does exactly what the admin UI says it does.
 *   activeProductCount— whether there is anything behind the link right now.
 *
 * Node imports this (scripts/prerender.mjs) — keep it alias-free and JSX-free.
 */

/** Shop filter pills. The merchant's switch, nothing else: a brand they turned
 * on stays offered even while it's waiting on stock. */
export function asFilterOptions(list) {
  return (list ?? []).filter((c) => c.isActive !== false);
}

/** Merchandising tiles (the homepage shelf): switched on AND stocked, because a
 * tile is a promise that there's something to buy on the other side. */
export function asShelfTiles(list) {
  return (list ?? []).filter((c) => c.isActive !== false && hasStock(c));
}

/** The /collections crawl hub. Stock only — `isActive` is a filter-menu
 * preference, not an indexing decision, and a deactivated-but-stocked
 * collection is still a page worth linking. Matches exactly what the backend
 * sitemap lists, so the hub never links to a URL the sitemap omits. */
export function asLinkableCollections(list) {
  return (list ?? []).filter((c) => hasStock(c) && !REDIRECTED_SLUGS.has(c.slug));
}

/** Collections that `vercel.json` 301s at the edge. The record exists and has
 * products, so it passes every other test here — but its URL never serves its
 * own content, and the hub's whole job is handing crawlers links worth
 * following. Must match `REDIRECTED_COLLECTION_SLUGS` in the backend's
 * sitemap.controller.js; `seo/vercelConfig.test.js` asserts this list against
 * the redirects themselves so the two cannot drift apart. */
export const REDIRECTED_SLUGS = new Set(["hot-wheels"]);

/** MISSING is not the same as zero. `activeProductCount` is sent by a backend
 * newer than this file; the two apps deploy separately, so during a window
 * where the frontend is ahead the field simply isn't there. Treating that as
 * "empty" would blank the homepage shelf and the whole /collections hub on a
 * perfectly stocked shop, so unknown counts stay visible and only a real 0
 * hides anything. */
function hasStock(c) {
  return c.activeProductCount === undefined || c.activeProductCount > 0;
}
