/** Search-intent copy per collection, keyed by slug.
 *
 * These are TITLE/DESCRIPTION templates, not page content — every claim in them
 * ("authentic", "nationwide delivery", "cash on delivery") is already true of
 * the store and stated on the storefront. Prose *about* a brand belongs in the
 * merchant-editable `description` field on the Brand/Category record, which
 * renders below the H1 when set and is simply absent when not.
 *
 * Each collection owns ONE keyword cluster rather than every page repeating the
 * same terms, which is how they end up competing with each other.
 *
 * Moved out of CollectionPage.jsx so scripts/prerender.mjs bakes the identical
 * copy — see lib/seo/constants.js for why the two must share code.
 */
export const SEO_COPY = {
  // ONE Hot Wheels brand owns the head term "hot wheels price in bangladesh".
  // `brand` is a single ref, so premium and mainline cars could never share a
  // page while they sat on two brands — they were merged onto this slug on
  // 2026-09-07 (brand = the marque, category = the tier), and the old
  // /brand/hot-wheels-premium URL 301s here from vercel.json so the ranking it
  // earned since August follows. The page leads with premium because that is
  // most of the catalogue; mainline is the honest entry point, not the pitch.
  hotwheels: {
    title: "Hot Wheels Price in Bangladesh — Premium & Mainline 1:64 Cars",
    description:
      "Hot Wheels prices in Bangladesh — premium Car Culture, Boulevard and Pop Culture castings plus mainline singles. Authentic Mattel, cash on delivery nationwide.",
  },
  "mini-gt": {
    title: "MINI GT in Bangladesh — Price & Authentic 1:64 Scale Models",
    description:
      "Buy authentic MINI GT 1:64 diecast in Bangladesh — JDM legends, supercars and race liveries. Verified castings, collector-grade packaging, cash on delivery nationwide.",
  },
  "premium-singles": {
    title: "Premium 1:64 Diecast Singles in Bangladesh",
    description:
      "Single premium 1:64 diecast cars in Bangladesh — Hot Wheels Premium and MINI GT, individually inspected, with cash on delivery and nationwide shipping.",
  },
  "multi-packs": {
    title: "Diecast Multi-Packs & Sets in Bangladesh",
    description:
      "Sealed diecast multi-packs and themed sets in Bangladesh — more cars per box, collector-grade packaging, cash on delivery nationwide.",
  },
  accessories: {
    title: "Diecast Card Protectors & Display Cases in Bangladesh",
    description:
      "Protect your collection — card protectors, blister cases and display cases for 1:64 diecast in Bangladesh. Affordable collector accessories with nationwide delivery.",
  },
};

/** Curated copy for a collection slug, or an honest generated fallback built
 * from the collection's own name (never invented prose). */
export function collectionCopy(slug, collection) {
  return (
    SEO_COPY[slug] ?? {
      title: `${collection.name} in Bangladesh`,
      description: `Browse ${collection.name} diecast in Bangladesh at DiecastBD — authentic castings, cash on delivery and nationwide shipping.`,
    }
  );
}
