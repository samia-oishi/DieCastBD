import { Link, useParams } from "react-router";

import { SITE_URL } from "@/lib/siteUrl";
import { buildCollection } from "@/lib/seo/routes";
import { formatTaka } from "@/lib/currency";
import { PROSE } from "@/components/shared/prose";
import { SeoHead } from "@/components/shared/Seo";
import { Container } from "@/components/shared/Container";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { PageLoadError } from "@/components/shared/PageLoadError";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { ROUTES } from "@/constants/routes";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts } from "./api/useProducts";
import { ProductGrid } from "./components/ProductGrid";

const PAGE_SIZE = 24;

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

  const { data: brands, isLoading: brandsLoading, isError: brandsError } = useBrands();
  const { data: categories, isLoading: catsLoading, isError: catsError } = useCategories();
  const { data: settings } = useSettings();

  const list = (isBrand ? brands : categories) ?? [];
  const collection = list.find((c) => c.slug === slug);
  const listLoading = isBrand ? brandsLoading : catsLoading;

  const { data, isLoading } = useProducts({
    [isBrand ? "brand" : "category"]: slug,
    limit: PAGE_SIZE,
    page: 1,
  });

  // Data-first guards (plan.md #92): with the brand/category lists baked into
  // prerendered HTML, `collection` usually exists before any network — render
  // it even if the refetch failed. Error/loading states only apply when the
  // list itself is missing; and a missing collection in a LOADED list is a
  // genuine 404 (NotFoundPage carries noindex, so the order matters).
  if (!collection) {
    if (listLoading) return <FullPageLoader />;
    if (isBrand ? brandsError : catsError) return <PageLoadError />;
    return <NotFoundPage />;
  }

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  // Cheapest live price, for the "from ৳X" line that answers price-intent
  // searches honestly — it's the real catalogue minimum, not a claim.
  const lowest = products.reduce((min, p) => {
    const price = p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
    return min === null || price < min ? price : min;
  }, null);

  // Curated title/description + CollectionPage/ItemList/BreadcrumbList JSON-LD,
  // built by the SAME code scripts/prerender.mjs bakes into the HTML.
  const seoModel = buildCollection({
    kind: isBrand ? "brand" : "category",
    slug,
    collection,
    products,
    total,
    settings,
    siteUrl: SITE_URL,
  });

  const shopHref = `${ROUTES.SHOP}?${isBrand ? "brand" : "category"}=${slug}`;

  return (
    <>
      <SeoHead model={seoModel} />

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

        {/* Live price table — the answer to "<collection> price in bangladesh",
            rendered from the SAME products query as the grid, so it is honest
            by construction: real catalogue, live prices, live availability.
            (Covers the current page of 24; the full catalogue is 32 products.) */}
        {products.length > 0 && (
          <div className="mx-auto mt-12 max-w-[760px]">
            <h2 className="font-display text-[20px] font-bold text-ink">
              {collection.name} price list in Bangladesh
            </h2>
            <div className="mt-4 overflow-x-auto rounded-[14px] border border-line">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-line bg-[#FCFCF9] text-[12px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-4 py-3 font-semibold">Model</th>
                    <th className="px-4 py-3 font-semibold">Price (BDT)</th>
                    <th className="px-4 py-3 font-semibold">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const price = p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
                    const inStock = (p.availableStock ?? 0) > 0;
                    return (
                      <tr key={p.slug} className="border-b border-line last:border-0">
                        <td className="px-4 py-3">
                          <Link to={`/products/${p.slug}`} className="font-medium text-brand-deep hover:underline">
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">{formatTaka(price)}</td>
                        <td className="px-4 py-3">
                          {inStock ? (
                            <span className="text-ink-soft">In stock</span>
                          ) : (
                            <span className="text-faint">Out of stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2.5 text-[12.5px] text-faint">
              Live prices from the current catalogue — cash on delivery, nationwide shipping across Bangladesh.
            </p>
          </div>
        )}

        {/* Merchant-authored landing content (Admin → Brands/Categories →
            Landing page content). Sanitized server-side; absent until written. */}
        {collection.content && (
          <div className="mx-auto mt-10 max-w-[760px]">
            <div className={PROSE} dangerouslySetInnerHTML={{ __html: collection.content }} />
          </div>
        )}

        {/* Collection FAQs — real merchant answers only; the section (and its
            FAQPage JSON-LD, added in buildCollection) don't exist until then. */}
        {(collection.faqs ?? []).filter((f) => f?.question && f?.answer).length > 0 && (
          <div className="mx-auto mt-10 max-w-[760px]">
            <h2 className="font-display text-[20px] font-bold text-ink">Frequently asked questions</h2>
            <div className="mt-4 flex flex-col gap-5">
              {collection.faqs
                .filter((f) => f?.question && f?.answer)
                .map((f) => (
                  <div key={f.question}>
                    <h3 className="text-[15px] font-bold text-ink">{f.question}</h3>
                    <p className="mt-1.5 text-[14px] leading-[1.7] text-ink-soft">{f.answer}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
