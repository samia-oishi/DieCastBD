# 2026-09-21 — Soft 404 cleanup, then isActive split from page existence, plus drag-ordered catalogue

## What was done

Two commits on `main`, **neither pushed** (user always pushes; `main` auto-deploys both
Vercel projects).

### `04bdfdc` — removed URLs answered 200 with "Page not found"

Search Console flagged 3 pages Soft 404. Indexed pages were **12 (Aug) → 59 (Sep)**, so
the earlier fix chain worked; the catalogue also doubled (51 → 100 URLs, 32 → 78 products).
My first hypothesis (thin content across the catalogue) was **wrong** — recorded because
acting on it meant rewriting 26 descriptions for a 3-page problem. Real cause: the SPA
catch-all serves `app.html` with HTTP 200 for any unmatched path. Nine 301s added to
`frontend/vercel.json`, each to a *relevant* destination; `vercelConfig.test.js` asserts
all nine. CCA brand + its 2 draft products deleted from the live DB (backed up to
`docs/content-drafts/.cca-deleted-backup-2026-09-21.json`). plan.md #93 (SEO track).

### `1427ac6` — `isActive` now means "offer as a shop filter", not "let the page exist"

Merchant asked for three things in one message: redirect unavailable brands/products to
`/shop` if SEO allows, keep a deactivated brand's page live at its URL, and choose the
display order.

The SEO verdict came first and **changed the first request**: a blanket "missing → /shop"
redirect is read as Soft 404 in its own right, and a brand that still exists has nothing
better to redirect to than its own page. The actual bug: `GET /brands`/`GET /categories`
returned active records only, while `CollectionPage` resolves the URL against that list —
so deactivating a brand *deleted its page* (200 + "Page not found").

- Both public endpoints return **every** record + `activeProductCount`
  (`listActiveBrands` → `listPublicBrands`, same for categories).
- New `frontend/src/lib/collectionVisibility.js` is the single narrowing rule:
  `asFilterOptions` (merchant's switch alone → shop filter pills, ShopPage chips),
  `asShelfTiles` (switched on **and** stocked → homepage shelf),
  `asLinkableCollections` (stocked → `/collections` hub, matching the sitemap exactly).
- Empty listing → `noindex, follow` via `buildCollection` → new robots support in
  `buildHeadTags`/`injectHead` → `SeoHead`. Page stays live with an honest
  "between restocks" state.
- Sitemap gates brand/category entries on having ≥1 active product, not `isActive`.
- `scripts/prerender.mjs` bakes the collection routes the sitemap deliberately omits.
- `renderProductBody`'s `activeBrandSlugs` → `knownBrandSlugs` (all brands are returned
  now, so only a *deleted* brand is worth suppressing).
- `PATCH /admin/{brands,categories}/reorder` (`backend/src/utils/reorderByIds.js`):
  whole list of ids, position → dense `sortOrder`, one `bulkWrite`.
- Admin drag & drop in `SimpleCatalogManager.jsx` (native HTML5, the `BlockCanvas`
  pattern) + up/down arrows; optimistic with exact rollback. The modal's manual
  "Sort order" input was removed.
- Docs: plan.md **#109**, log.md entry, DEPLOYMENT.md rule updated.

## Current state

- Working tree clean. **2 commits unpushed.**
- Backend 329/329 (30 files), frontend 224/224 (25 files), lint at its existing warnings.
- Verified against production data: 98/98 strict prerender, `verify-prerender` green,
  hydration parity green, `verify:offline` green on every page type.

## Gotchas worth keeping

- **"Unknown" is not "zero", twice, and both would have been outages.** `buildCollection`
  tests `total === 0` (not falsy) because the count query is in flight on first render;
  and a **missing** `activeProductCount` counts as unknown in `collectionVisibility.js`
  because the two apps deploy separately — a frontend ahead of the backend would
  otherwise blank the homepage shelf and the entire `/collections` hub.
- **`PATCH /reorder` must be declared before `PATCH /:id`.** Express matches in
  declaration order; reversed, it silently updates a brand with id `"reorder"`.
  `test/unit/catalogReorderRoutes.test.js` asserts the order.
- **A local `npm run build` skips prerendering** (`VITE_SITE_URL` is localhost) and that
  is not a failure. To exercise the real path:
  `VITE_SITE_URL=https://diecastbd.com VITE_API_BASE_URL=https://api.diecastbd.com/api/v1 npm run build`.
  `verify:hydration` compares baked vs rendered heads, so the **build** must use the same
  origin or every route reports "canonical drift" (localhost vs production) — an artifact,
  not a regression.
- `category` is an **ARRAY** on Product — the count aggregation needs `$unwind` before
  `$group`. `brand` is a single ref and must not be unwound.
- `docs/DEPLOYMENT.md` no longer says deactivating a brand needs a redirect. A brand or
  category **deleted outright** still does.

## Left for the merchant

- Push both commits (`04bdfdc`, `1427ac6`); backend redeploys on Render, frontend on Vercel.
  Until the backend ships, `/brands` still returns active-only — the frontend degrades
  safely (unknown counts stay visible) but deactivated pages stay broken until then.
- GSC → Soft 404 report → **Validate Fix** (after the deploy).
- Google Business Profile verification was pending as of 2026-09-21.
- Hot Wheels Mainline brand still not created — name it exactly `Hot Wheels Mainline`
  (slug `hot-wheels-mainline`); curated SEO copy is already in `collectionCopy.js` and a
  draft with ⚠ price placeholders sits at `docs/content-drafts/collections/`.
- 44 URLs still in "Discovered – currently not indexed", expected to drain naturally.
