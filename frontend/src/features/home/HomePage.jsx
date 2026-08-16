import { SITE_URL } from "@/lib/siteUrl";
import { buildHome } from "@/lib/seo/routes";
import { ROUTES } from "@/constants/routes";
import { SeoHead } from "@/components/shared/Seo";
import { ProductCarousel } from "@/components/shared/ProductCarousel";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts, useProduct } from "@/features/products/api/useProducts";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
import { HOME_PRODUCT_QUERIES } from "./homeQueries";
import { HeroSection } from "./components/HeroSection";
import { ShopByShelf } from "./components/ShopByShelf";
import { FeaturedSpotlight } from "./components/FeaturedSpotlight";
import { PremiumShelfBanner } from "./components/PremiumShelfBanner";
import { TrustStrip } from "./components/TrustStrip";
import { TestimonialsSection } from "./components/TestimonialsSection";

// Maps the hero `variant` enum to its per-variant content key in settings.
const HERO_CONTENT_KEY = {
  "lime-showroom": "limeShowroom",
  "dark-spotlight": "darkSpotlight",
  "photo-fullbleed": "photoFullbleed",
};

export function HomePage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  // Params come from homeQueries.js because scripts/prerender.mjs fetches
  // exactly these at build time and bakes the responses into the HTML — a
  // literal here that drifted from that list would silently disable the bake.
  const featured = useProducts(HOME_PRODUCT_QUERIES.featured);
  const newArrivals = useProducts(HOME_PRODUCT_QUERIES.newArrivals);
  const collectorPicks = useProducts(HOME_PRODUCT_QUERIES.collectorPicks);
  // Admin can pin a specific product to the Featured spotlight card; resolve it
  // (with brand + all fields) via the same by-slug endpoint the PDP uses.
  const spotlightProduct = useProduct(settings?.featuredSpotlight?.productSlug);

  const sections = settings?.homepageSections;
  const isEnabled = (key) => sections?.[key]?.enabled ?? true;
  const hero = sections?.hero;

  // Title/description/share-image/GSC token all come from Settings; the OnlineStore
  // and WebSite JSON-LD are built by the SAME code scripts/prerender.mjs bakes in.
  const seoModel = buildHome({ settings, siteUrl: SITE_URL });

  return (
    <div>
      <SeoHead model={seoModel} />

      {isEnabled("hero") && (
        <HeroSection
          variant={hero?.variant}
          // hero.image is the home; heroBanner[0] is the pre-cleanup legacy spot,
          // kept as a fallback so a production DB that hasn't run the migration
          // yet keeps its hero image through the deploy window.
          image={hero?.image ?? settings?.heroBanner?.[0]?.image}
          highlightCard={hero?.highlightCard}
          content={hero?.content?.[HERO_CONTENT_KEY[hero?.variant] ?? "limeShowroom"]}
        />
      )}

      {isEnabled("brandsStrip") && (
        <ShopByShelf
          tiles={settings?.shopByShelf}
          heading={settings?.shopByShelfHeading}
          subtitle={settings?.shopByShelfSubtitle}
          brands={brands}
          categories={categories}
          isLoading={settingsLoading}
        />
      )}

      {isEnabled("collectorPicks") && (
        <ProductCarousel
          title="Collector picks"
          subtitle="The shelf-worthy shortlist — chosen like it's our money."
          products={collectorPicks.data?.data}
          isLoading={collectorPicks.isLoading}
          viewAllHref={ROUTES.SHOP}
          className="pt-5 md:pt-[76px]"
        />
      )}

      {isEnabled("featuredProducts") && (
        <FeaturedSpotlight
          products={featured.data?.data}
          spotlightConfig={settings?.featuredSpotlight}
          spotlightProduct={spotlightProduct.data}
          isLoading={settingsLoading}
        />
      )}

      {isEnabled("collectorPromise") && <PremiumShelfBanner {...settings?.collectorPromise} />}

      {isEnabled("newArrivals") && (
        <ProductCarousel
          title="New arrivals"
          subtitle="Just landed from the latest import batch."
          products={newArrivals.data?.data}
          isLoading={newArrivals.isLoading}
          viewAllHref={ROUTES.SHOP}
          className="pt-[26px] md:pt-[76px]"
        />
      )}

      {isEnabled("whyChooseUs") && <TrustStrip />}
      {isEnabled("testimonials") && <TestimonialsSection testimonials={settings?.testimonials} isLoading={settingsLoading} />}
    </div>
  );
}
