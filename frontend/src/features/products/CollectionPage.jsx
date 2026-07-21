import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router";

import { canonical } from "@/lib/siteUrl";
import { formatTaka } from "@/lib/currency";
import { Seo } from "@/components/shared/Seo";
import { Container } from "@/components/shared/Container";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { ROUTES } from "@/constants/routes";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
import { useProducts } from "./api/useProducts";
import { ProductGrid } from "./components/ProductGrid";

const PAGE_SIZE = 24;

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
 */
const SEO_COPY = {
  "hot-wheels-premium": {
    title: "Hot Wheels Premium in Bangladesh — Price & Authentic 1:64 Diecast",
    description:
      "Buy authentic Hot Wheels Premium diecast in Bangladesh. Real Riders, Car Culture and Boulevard 1:64 castings with collector-grade packaging, cash on delivery and nationwide shipping.",
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

/** Brand and category landing pages: `/brand/:slug` and `/category/:slug`.
 *
 * These exist because `/shop?brand=…` is a filtered VIEW that canonicalises
 * back to /shop, so it can never rank on its own. A collection someone searches
 * for by name ("hot wheels bangladesh") needs a page with that name in the H1,
 * its own canonical, and its own schema — this is that page.
 *
 * The full filter UI stays on /shop; this is a browse-and-buy surface with one
 * facet already applied, plus a link through to the filtered shop.
 */
export function CollectionPage({ kind }) {
  const { slug } = useParams();
  const isBrand = kind === "brand";

  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: categories, isLoading: catsLoading } = useCategories();

  const list = (isBrand ? brands : categories) ?? [];
  const collection = list.find((c) => c.slug === slug);
  const listLoading = isBrand ? brandsLoading : catsLoading;

  const { data, isLoading } = useProducts({
    [isBrand ? "brand" : "category"]: slug,
    limit: PAGE_SIZE,
    page: 1,
  });

  if (listLoading) return <FullPageLoader />;
  if (!collection) return <NotFoundPage />;

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const path = `/${isBrand ? "brand" : "category"}/${slug}`;
  const url = canonical(path);

  // Cheapest live price, for the "from ৳X" line that answers price-intent
  // searches honestly — it's the real catalogue minimum, not a claim.
  const lowest = products.reduce((min, p) => {
    const price = p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
    return min === null || price < min ? price : min;
  }, null);

  const copy = SEO_COPY[slug] ?? {
    title: `${collection.name} in Bangladesh`,
    description: `Browse ${collection.name} diecast in Bangladesh at DiecastBD — authentic castings, cash on delivery and nationwide shipping.`,
  };

  // CollectionPage + ItemList tells Google this is a product listing and what's
  // on it; BreadcrumbList mirrors the visible trail.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url,
    isPartOf: { "@type": "WebSite", name: "DiecastBD", url: canonical("/") },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
      itemListElement: products.slice(0, 24).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: canonical(`/products/${p.slug}`),
        name: p.title,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: canonical("/shop") },
      { "@type": "ListItem", position: 3, name: collection.name },
    ],
  };

  const shopHref = `${ROUTES.SHOP}?${isBrand ? "brand" : "category"}=${slug}`;

  return (
    <>
      <Seo title={copy.title} noTemplate description={copy.description} image={collection.logo?.url ?? collection.image?.url}>
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
      </Seo>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(collectionJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <Container className="pt-6">
        <Breadcrumb
          items={[
            { label: "Home", to: ROUTES.HOME },
            { label: "Shop", to: ROUTES.SHOP },
            { label: collection.name },
          ]}
        />
      </Container>

      <Container className="pb-12 pt-6 md:pt-8">
        <div className="max-w-[760px]">
          {/* H1 is the collection's real name — the keyword in the strongest
              on-page slot, which a filtered /shop view could never own. */}
          <h1 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink md:text-[38px]">
            {collection.name} in Bangladesh
          </h1>

          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-faint">
            <span>
              {total} {total === 1 ? "product" : "products"}
            </span>
            {lowest !== null && (
              <>
                <span aria-hidden>·</span>
                <span>from {formatTaka(lowest)}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>Cash on delivery · nationwide</span>
          </p>

          {/* Merchant-authored intro, editable in Admin → Brands/Categories.
              Absent until they write one — never invented here. */}
          {collection.description && (
            <p className="mt-4 text-[14.5px] leading-[1.7] text-ink-soft">{collection.description}</p>
          )}
        </div>

        <div className="mt-8">
          <ProductGrid products={products} isLoading={isLoading} />
        </div>

        {total > PAGE_SIZE && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-[13.5px] text-faint">
              Showing {products.length} of {total}
            </p>
            <Link
              to={shopHref}
              className="inline-flex h-11 items-center rounded-full bg-ink px-6 font-display text-[13.5px] font-bold text-white transition-colors hover:bg-[#26301A]"
            >
              See all {collection.name} — filter &amp; sort
            </Link>
          </div>
        )}
      </Container>
    </>
  );
}
