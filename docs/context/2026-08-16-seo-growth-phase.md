# 2026-08-16 — SEO growth phase (research → /collections hub → body baking → content drafts)

Follows `2026-08-05-seo-indexing-fix.md` (decisions #88–90, live in production). This
session: decision #91. Goal escalated to "rank top in Bangladesh" for hot wheels / mini gt
price queries.

## Research findings that drive everything (3 agent passes, all in plan.md #91)

- **Torklub** (Chattogram) is the only real SEO competitor — ranks off ONE 1,300-word
  landing page (price table + the niche's only FAQPage schema). Model to copy ×5.
- **"mini gt price in bangladesh" has no dedicated page anywhere** — softest high-intent
  target. "hot wheels shop dhaka": TikTok ranks #1, query unclaimed, we're Dhaka-based.
- **Bengali-script queries return water heaters** — English-only confirmed. Real
  vernacular = the "bd" suffix (use in H2s/FAQ text, "bangladesh" in titles).
- Win-first keywords + 12 guide topics: `docs/content-drafts/README.md` and plan file.
- GSC noindex mystery CLOSED: stale `www` crawls from 2026-07-06; all four original alert
  reasons benign (8 URLs). The real issue was 39 never-crawled URLs + zero anchors in HTML.

## What shipped this session (code — committed? CHECK git status at session start)

- **`injectRoot()`** (`lib/seo/injectHead.js`): bakes body HTML into `<div id="root">`.
  NOT tagged `data-prerendered` — main.jsx strip would blank it; createRoot REPLACES (not
  hydrates) so untagged baked bodies show until first paint, no mismatch. Parity verified.
- **`/collections` hub**: `lib/seo/collectionsIndex.js` (head model + body renderer),
  `features/collections/CollectionsIndexPage.jsx` (React twin), route above `/:slug`
  catch-all, **unconditional** footer link (merchant nav settings REPLACE default arrays),
  sitemap STATIC_PATHS + RESERVED_SLUGS on both sides. Raw HTML now carries 32 product +
  2 brand + 3 category anchors. verify-prerender asserts the counts.
- **Brand/category body baking**: H1 + intro + product anchors + content + FAQ text
  (`renderCollectionBody`). Brand body ~158 → 326+ words in raw HTML.
- **Brand/Category `content` + `faqs[]`**: models/zod/controllers (sanitizer extracted to
  `backend/src/utils/sanitizeContent.js`, shared with pages), admin editing in
  SimpleCatalogManager (Tiptap RichTextEditor + FAQ repeater), storefront render in
  CollectionPage: **live price table** (same products query as the grid → honest), long
  content (shared PROSE from `components/shared/prose.js`), FAQ section. FAQPage JSON-LD
  only when real FAQs exist (`buildFaqJsonLdFromList`). Rich-results caveat recorded.
- **Guides pipeline**: public `GET /pages` (published, minus SYSTEM_PAGE_SLUGS),
  `usePublishedPages()`, Guides section on hub (tolerant fetch in prerenderer — old
  backend deploy can't fail a strict build), `og:type article` + `article:modified_time`
  + visible updated date on CmsPage.
- **Product paragraphs**: `DescriptionParagraphs` splits on blank lines (was one `<p>`).
- prerenderer `modelFor` now returns `{model, body}` for body-baked routes.

## Content drafts — MERCHANT APPROVAL PENDING (`docs/content-drafts/`)

5 collection packages, 4 guides, 32 product descriptions (120–180 words each; live median
was 20). Every claim from catalogue/settings/store's own copy; **⚠ VERIFY markers** where
merchant must confirm (MINI GT protector fit, mainline market price). Merchant pastes via
admin → then REDEPLOY (manual by decision) → GSC Request Indexing.

## Merchant decisions this session

Content: Claude drafts / merchant approves. English-only. Reviews deferred. GBP: yes
(merchant verifies identity). **Catalogue expanding: mainlines + CCA + MSZ + Bburago +
Tomica.** New brands need ZERO code (auto: landing page, sitemap, baked head, hub slot,
content fields) — only add curated title entries to `lib/seo/collectionCopy.js` per brand.
The broad "hot wheels price in bangladesh" head term is now directly targeted (guide 3),
not deferred.

## Verified

frontend 134/134 · backend 165/165 · strict prerender 48/48 distinct titles/canonicals ·
hub anchors asserted · hydration parity green on /collections + /brand/mini-gt.

## Next session picks up

1. Commit (if not committed — check `git status`), push, redeploy; backend deploys first
   (GET /pages + sitemap /collections), then frontend.
2. Merchant: approve drafts → paste → redeploy → Request Indexing (/collections, brands,
   categories first; ~10/day quota).
3. Merchant setup tasks: GBP (service-area, Dhaka), PRERENDER_STRICT=1 if not yet set,
   unpublish /qa-blocks (still in sitemap), 1200×630 share image.
4. Weekly GSC: watch "Discovered – currently not indexed" drain from 39.
5. When new brands land: SEO_COPY entries + landing content per brand BEFORE announcing.
6. Later: reviews system (real reviews only), Dhaka landing angle, DCCCB/TBS press
   outreach, guides ⑤–⑩.
