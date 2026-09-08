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
  "hot-wheels-premium": {
    title: "Hot Wheels Premium in Bangladesh — Price & Authentic 1:64 Diecast",
    description:
      "Buy authentic Hot Wheels Premium diecast in Bangladesh. Real Riders, Car Culture and Boulevard 1:64 castings with collector-grade packaging, cash on delivery and nationwide shipping.",
  },
  // The BROAD head term "hot wheels price in bangladesh" belongs to the
  // /category/hot-wheels page, not to either brand page — that category spans
  // premium AND mainline, so the searcher sees the full range. Sending that
  // query to a mainline-only list would undersell a shop whose catalogue is
  // 43 premium castings against 12 mainline (merchant decision, 2026-09-07:
  // "we're a premium brand, we just keep some mainline as an option").
  "hot-wheels": {
    title: "Hot Wheels Price in Bangladesh — Premium & Mainline 1:64 Cars",
    description:
      "Hot Wheels prices in Bangladesh — premium Car Culture, Boulevard and Pop Culture castings plus mainline singles. Authentic Mattel, cash on delivery nationwide.",
  },
  // Mainline keeps the narrower, honestly-cheaper cluster and supports the
  // category page above rather than competing with it for the head term.
  hotwheels: {
    title: "Hot Wheels Mainline in Bangladesh — Original 1:64 Cars",
    description:
      "Original Hot Wheels mainline cars in Bangladesh — the toy-aisle 1:64 castings, including Treasure Hunt chases. Authentic Mattel, cash on delivery nationwide.",
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
