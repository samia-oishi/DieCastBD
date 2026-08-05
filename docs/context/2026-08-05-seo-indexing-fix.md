# 2026-08-05 — Search Console indexing fix (prerender rewrite + SEO hygiene)

## What prompted it

Google Search Console, 28 Jul 2026: "New reasons prevent pages from being indexed on site
diecastbd.com" — *Alternate page with proper canonical tag*, *Excluded by 'noindex' tag*,
*Not found (404)*, *Page with redirect*. Merchant constraint: **no Next.js migration.**

## The actual cause (verified live with curl, not inferred from the repo)

**Every URL on diecastbd.com served a byte-identical 4067-byte shell** — same generic
`<title>DiecastBD — Premium Diecast Collectibles</title>`, and **no `<link rel="canonical">`
anywhere.** Confirmed on `/`, `/about`, `/faq`, `/shop`, `/privacy-policy`,
`/products/<real-slug>`, `/brand/<real-slug>`.

`scripts/prerender.mjs` (Playwright) had been failing silently in production for months:
`preview()` / `chromium.launch()` sat in a `try {} finally {}` with **no `catch`**, so failures
escaped to `main().catch()` → `.finally(() => process.exit(0))`. Build green, zero routes baked.
A second swallow hid per-route failures. Proof it never ran: `content-disposition` showed `/`
serving `dist/index.html` but `/about`, `/faq`, `/shop` all serving `filename="app.html"`.

Other defects confirmed live:

| Finding | Now |
|---|---|
| `/share-image` → **404** while set as `og:image`+`twitter:image` on every page | falls back to `android-chrome-512x512.png` |
| `/index.html` → 200 duplicate of home | 301 → `/` |
| `/app.html` → 200, indexable | `X-Robots-Tag: noindex` (**never a redirect** — it's the SPA rewrite target) |
| unknown slugs → HTTP 200 soft-404, no `noindex` | `NotFoundPage` renders `noindex` |
| `api.diecastbd.com/robots.txt` → JSON 404 | real robots.txt + blanket `X-Robots-Tag` |
| robots.txt `Disallow`-ing the routes we need deindexed | all `Disallow`s removed (see below) |
| `/demo`, `/qa-blocks` (QA junk) in the public sitemap | **still live — merchant action** |

## What the GSC exports actually said (resolved 2026-08-05, after the fix was built)

The merchant exported the buckets. **All four reasons from the original alert are benign,
stale, or already addressed — 8 URLs total, zero real problems:**

| Reason | Count | The actual URLs | Verdict |
|---|---|---|---|
| Alternate page w/ canonical | 4 | `/shop?featured=true`, `?category=accessories`, `?brand=mini-gt`, `?brand=hot-wheels-premium` | **Working as designed** — exactly the `shopCanonicalPath` behaviour |
| Page with redirect | 1 | `http://diecastbd.com/` | Correct http→https 308 |
| Excluded by 'noindex' | 2 | `http://www.diecastbd.com/`, `https://www.diecastbd.com/` — last crawled **2026-07-06** | **Mystery solved: it was `www`.** Today www 308s to apex with no `X-Robots-Tag` (verified). Stale crawl from before the domain was aliased; self-resolves on recrawl |
| Not found (404) | 1 | `https://api.diecastbd.com/` | **Confirms it's a Domain property** — the API subdomain is in scope. Fixed by the backend robots.txt + `X-Robots-Tag` |

**The real problem was a FIFTH bucket, not in the original alert:**

> **"Discovered – currently not indexed" — 39 URLs, `Last crawled: 1970-01-01` (never crawled).**
> 2 brands, 3 categories, `/demo`, `/qa-blocks`, and all 32 products. Essentially the whole
> catalogue: Google knows these URLs exist (from the sitemap) but has never fetched one.

Timing note in this work's favour: because those 39 pages have **never been crawled**, they will
be crawled for the *first* time with correct per-page metadata rather than being re-crawled out of
a duplicate-shell hole. The fix landed before the damage, not after.

**Newly identified, and the most likely lever on those 39 URLs:** there are **zero crawlable
`<a href>` links in any baked HTML** — the prerender bakes the `<head>` only, so every page body is
still an empty `<div id="root">`. Verified: `dist/index.html`, `dist/shop/index.html` and
`dist/brand/mini-gt/index.html` each contain **0** anchors and **0** `/products/` links. The
sitemap is therefore the *only* signal telling Google these pages exist, with no internal-link
support at all — a well-known cause of sitemap-only URLs sitting in "Discovered, not indexed".
See the follow-up list below.

## What shipped

**Prerender, browser-free** (`scripts/prerender.mjs` rewritten). Fetches the API with plain Node
and string-splices the `<head>`. Route discovery parses the backend's own `/sitemap.xml`, so the
prerendered set and the sitemap cannot drift. 48/48 routes in ~8 s, no Chromium.
`vercel-build` no longer installs Playwright (kept as a devDep — the QA scripts use it).

**Shared SEO modules** — `src/lib/seo/{constants,collectionCopy,routes,injectHead}.js`. Every
title/description/canonical/JSON-LD formula, imported by React *and* the build script.
Must stay alias-free, JSX-free, `import.meta.env`-free (plain Node imports them); `siteUrl` is
always a parameter because Node can't import `lib/siteUrl.js`. Pages build a model and pass it to
the new `<SeoHead model>`; `<Seo>` is now a prop wrapper over the same component.

**The keystone** — `main.jsx` strips `[data-prerendered]` before `createRoot`. react-helmet-async
v3 on React 19 **appends** metadata and never removes what's in `<head>`, so without this every
route ships two titles, two canonicals and two Product JSON-LD entities.

**Loud failure** — `process.exitCode` (not `process.exit(0)`), `PRERENDER_STRICT=1` +
`PRERENDER_MIN_ROUTES`, `dist/prerender-report.json`, and `verify-prerender.mjs` wired into
`npm run build`. Plus opt-in `verify-hydration-parity.mjs` (`npm run verify:hydration`).

**`noindex` over `Disallow`** — robots.txt `Disallow` rules removed (a URL Google can't crawl is
one where it can never see the `noindex` that removes it). Replaced by `X-Robots-Tag` in
`vercel.json` + a `noindex` prop on `<Seo>` across cart/checkout/account/orders/wishlist/auth.

**404-vs-error split (the risky part)** — `CmsPage`, `PageView`, `ProductDetailPage`,
`CollectionPage` rendered `NotFoundPage` on *any* query error. Since it now carries `noindex`, one
transient API failure during a Googlebot render would have deindexed live products, brand pages
and all four policy pages. Each now branches on `error?.response?.status === 404`, otherwise
showing the new neutral `PageLoadError`. `useProduct` gained
`retry: (n, e) => e?.response?.status !== 404 && n < 2` (the default retried 404s ~7 s on a
spinner, long enough for a crawler to leave before seeing the `noindex`).

**Backend** — `/share-image` fallback, `GET /robots.txt`, blanket `X-Robots-Tag` with
`/sitemap.xml` **allow-listed** (load-bearing: the storefront proxies that exact route and
upstream headers pass through), sitemap reserved-slug filter.

## Verified

48/48 baked with distinct titles + canonicals · product JSON-LD with live price 2690 / `InStock` ·
hydration parity in Chromium: baked === rendered, exactly one of each tag · soft-404s and private
routes render `noindex`, `/shop` renders none · frontend 105/105, backend 121/121, lint clean.

## Gotchas for next session

- **`vite preview` is not a faithful local stand-in.** Its SPA fallback rewrites `/faq` to
  `index.html`, so per-route snapshots look like they didn't bake. `verify-hydration-parity.mjs`
  ships its own static server mimicking Vercel's filesystem-then-rewrite order (verified in
  production: `/robots.txt` and `/index.html` are served as real files despite the `/(.*)` catch-all).
- `dist/app.html` must stay neutral — it's what the catch-all serves for every non-prerendered
  route. The prerender copies it from the untouched shell *first*, and writes home *last*.
- Never `Disallow` a path you also want `noindex`ed. The comment in `robots.txt` says why.
- Never blanket-`noindex` the API host without allow-listing `/sitemap.xml`.

## Merchant decisions (asked 2026-08-05)

- **Freshness → "leave it manual".** No deploy hook, no rebuild cron, no admin button.
  **Operational consequence, accepted:** a product added or edited in admin keeps serving the
  generic shell (no per-product title/canonical) **until someone redeploys the frontend**. Google
  still sees correct data via JS rendering, so this costs first-pass crawl quality, not
  correctness. *Redeploy after catalogue changes* — Vercel → frontend project → Deployments →
  ⋯ → Redeploy. Revisit if the catalogue starts changing often.
- **Slug renames → freeze slugs after creation.** Shipped, and extended beyond
  products/pages to brands and categories (their landing pages carry sitemap priority 0.9,
  above products' 0.8, so a brand rename was the worst case). See plan.md #90.
- **Real HTTP 404s → leave as 200 + `noindex`.** The `noindex` does the real work; narrowing the
  catch-all is only safe once rebuilds are automated, which they now deliberately are not — a
  product created between builds would hard-404 for actual customers. Correctly deferred.

## Not done — needs the merchant / a follow-up

1. **Set `PRERENDER_STRICT=1` and `PRERENDER_MIN_ROUTES=20`** in Vercel Production + Preview
   (frontend project; *not* a `VITE_` var). Caveat: strict mode ties deploys to the API being up
   — if `api.diecastbd.com` is down at push time the build fails instead of shipping a site with
   no metadata. That's the intended trade.
2. **Unpublish `/demo` and `/qa-blocks`** in Admin → Pages (ship the `noindex` first — unpublishing
   alone just turns indexed junk into an indexed 200 saying "Page not found").
3. **Upload a real 1200×630 share image** in Admin → Settings → SEO.
4. **Crawlable internal links — now the highest-value remaining item.** Nothing in raw HTML links
   to a product page. Options, cheapest first: (a) a real, user-facing HTML sitemap page listing
   every collection and product, prerendered like any other route — honest, useful, and gives all
   39 URLs an internal link; (b) bake the product grid's `<a href>` list into collection/shop page
   bodies. For (b) note `createRoot` **clears** the container on first render, so baked body
   content is wiped on mount with no hydration mismatch — but it would be briefly visible
   unstyled before JS boots, which is why (a) is the cleaner option.
5. **Request indexing** for a few key URLs (URL Inspection → Request Indexing, ~10/day quota) —
   the most direct nudge for "Discovered, not indexed". Spend it on `/`, `/shop`, the two brand
   pages and your best-selling products.
6. Available if wanted later: `previousSlugs: []` + an editable slug field, so a *deliberate*
   rename still resolves the old URL. Note a true 301 for a DB-driven path is impossible from
   static hosting — it'd be client-side replace-navigation plus a correct canonical.

Decisions #88, #89 and #90 in `docs/plan.md` §7; entry in `docs/log.md`.
