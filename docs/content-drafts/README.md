# Content drafts — awaiting merchant approval

Drafted by Claude from **real catalogue data** (live API: titles, prices, stock, series,
your own product descriptions) plus store-wide facts (COD, ৳70 inside Dhaka / ৳120 outside,
24–48h Dhaka delivery, from Settings). Per the project rule — **no fabricated content, ever**
— nothing here goes live until you have read it and pasted it in yourself.

Every factual claim falls into one of three buckets:
1. **From your catalogue/settings** — prices, series names, delivery terms. Safe.
2. **Public facts about the product lines** — e.g. "Hot Wheels premium lines use metal
   body + metal chassis and Real Riders rubber tires". Verifiable, and your own product
   descriptions already state them.
3. **⚠ VERIFY markers** — anything I could not confirm from your data. Check or delete
   these before publishing.

## Where each draft goes

| Draft | Destination | How |
|---|---|---|
| `collections/*.md` | Admin → Brands / Categories → edit → **Landing page content** + **FAQs** | Paste the HTML section into the rich-text editor (or retype — headings/bold survive paste), add each FAQ pair |
| `guides/*.md` | Admin → Pages → New page (block builder) | Title as given; body as text blocks (markdown works); add a `products` block where marked; **Publish** |
| `products.md` | Admin → Products → edit → Description | Paste each product's description (blank lines between paragraphs are preserved on the storefront now) |

## After publishing

1. Redeploy the frontend (Vercel → Deployments → Redeploy) so the new copy is baked into
   the HTML — until then Google's JS rendering still sees it, but the raw HTML doesn't.
2. GSC → URL Inspection → Request Indexing for the changed pages (quota ~10/day: spend on
   /collections, the two brand pages, three categories, then guides).

## Catalogue expansion (mainlines · CCA · MSZ · Bburago · Tomica)

Merchant decision 2026-08-16: mainlines and new brands are coming. What that means here:

- **The broad head terms ("hot wheels price in bangladesh", "toy car price bd") become
  directly winnable** — mainline price points make the site relevant to the ৳300–400
  searcher, not only collectors. Guide 3 already targets the broad term; update its table
  with your real mainline prices the day they land.
- **Zero code is needed per new brand.** Creating a brand in Admin automatically gets:
  a `/brand/<slug>` landing page, sitemap entry, prerendered head, a slot on /collections,
  and the new Landing page content + FAQs fields. The page title falls back to
  "<Brand> in Bangladesh" until a curated entry is added to
  `frontend/src/lib/seo/collectionCopy.js` (one small code edit per brand — worth doing:
  e.g. "Tomica in Bangladesh — Price & Original Japanese Diecast").
- Each new brand should launch WITH landing content + 3–6 FAQs (same shape as the drafts
  in `collections/`) — a bare grid page ranks like a bare grid page.
- FancyWheels currently owns the scale/multi-brand queries ("1:64 diecast bangladesh",
  Tomica/Bburago collections) — once those brands land, that's the next competitor set to
  study before writing their pages.

## Keyword targets these drafts were written against

- /brand/hot-wheels-premium → "hot wheels premium price in bangladesh"
- /brand/mini-gt → "mini gt price in bangladesh", "mini gt bangladesh"
- /category/accessories → "diecast display case bangladesh", "hot wheels card protector bd"
- /category/premium-singles → "hot wheels car culture bangladesh", "jdm diecast bangladesh"
- /category/multi-packs → "hot wheels 5 pack bangladesh"
- Guides → see each file's header

## ⚠ Lesson from the 2026-08-16 injection (fixed 2026-08-26)

Direct MongoDB writes bypass Mongoose timestamps, so `updatedAt` — which the sitemap
serves as `<lastmod>` — did NOT move when the content changed. For 10 days the sitemap
told Google the most-changed pages were unchanged. Any future direct content write must
also `$set updatedAt: new Date()` on the same document.
