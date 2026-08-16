import { Link } from "react-router";

import { SITE_URL } from "@/lib/siteUrl";
import { buildCollectionsIndex, COLLECTIONS_TITLE, COLLECTIONS_DESCRIPTION } from "@/lib/seo/collectionsIndex";
import { SeoHead } from "@/components/shared/Seo";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts } from "@/features/products/api/useProducts";
import { usePublishedPages } from "@/features/pages/api/usePages";

/** The site's crawlable index: every brand, category, product and guide as a
 * plain link list on one page.
 *
 * This is the React twin of the BODY that scripts/prerender.mjs bakes into
 * dist/collections/index.html via renderCollectionsIndexBody — the one page
 * whose raw HTML carries real <a href> links for crawlers (see
 * lib/seo/collectionsIndex.js for why). Keep the two in the same shape: same
 * sections, same link targets. It's also honestly useful — a full-catalogue
 * overview for people, linked from the footer.
 */
function LinkSection({ title, children }) {
  if (!children?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="font-display text-[19px] font-bold text-ink">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">{children}</ul>
    </section>
  );
}

const Item = ({ to, label }) => (
  <li>
    <Link to={to} className="text-[14.5px] font-medium text-brand-deep hover:underline">
      {label}
    </Link>
  </li>
);

export function CollectionsIndexPage() {
  const { data: settings } = useSettings();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: productsData } = useProducts({ limit: 100, page: 1 }); // backend caps limit at 100; paginate here if the catalogue ever outgrows it
  const { data: pages } = usePublishedPages();

  const products = productsData?.data ?? [];

  return (
    <>
      <SeoHead model={buildCollectionsIndex({ settings, siteUrl: SITE_URL })} />
      <div className="mx-auto w-full max-w-[760px] px-4 pb-12 pt-8 md:px-6 md:pt-11">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink md:text-[36px]">
          {COLLECTIONS_TITLE}
        </h1>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-muted-foreground">{COLLECTIONS_DESCRIPTION}</p>

        <LinkSection title="Brands">
          {(brands ?? []).map((b) => (
            <Item key={b.slug} to={`/brand/${b.slug}`} label={`${b.name} in Bangladesh`} />
          ))}
        </LinkSection>

        <LinkSection title="Categories">
          {(categories ?? []).map((c) => (
            <Item key={c.slug} to={`/category/${c.slug}`} label={`${c.name} in Bangladesh`} />
          ))}
        </LinkSection>

        <LinkSection title="All products">
          {products.map((p) => (
            <Item key={p.slug} to={`/products/${p.slug}`} label={p.title} />
          ))}
        </LinkSection>

        <LinkSection title="Guides">
          {(pages ?? []).map((g) => (
            <Item key={g.slug} to={`/${g.slug}`} label={g.title} />
          ))}
        </LinkSection>
      </div>
    </>
  );
}

export default CollectionsIndexPage;
