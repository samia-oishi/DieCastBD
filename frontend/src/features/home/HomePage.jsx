import { Helmet } from "react-helmet-async";

import { SITE_URL, canonical } from "@/lib/siteUrl";
import { ROUTES } from "@/constants/routes";
import { Seo } from "@/components/shared/Seo";
import { ProductCarousel } from "@/components/shared/ProductCarousel";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts, useProduct } from "@/features/products/api/useProducts";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
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

  const featured = useProducts({ featured: true, limit: 4 });
  const newArrivals = useProducts({ newArrival: true, limit: 8, sort: "newest" });
  const collectorPicks = useProducts({ hero: true, limit: 8 });
  // Admin can pin a specific product to the Featured spotlight card; resolve it
  // (with brand + all fields) via the same by-slug endpoint the PDP uses.
  const spotlightProduct = useProduct(settings?.featuredSpotlight?.productSlug);

  const sections = settings?.homepageSections;
  const isEnabled = (key) => sections?.[key]?.enabled ?? true;
  const hero = sections?.hero;

  const social = settings?.socialLinks ?? {};
  const contact = settings?.contactInfo ?? {};
  const sameAs = [social.facebook, social.instagram, social.whatsapp].filter(Boolean);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "DiecastBD",
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
    description: "Premium 1:64 diecast collectibles in Bangladesh — authentic Hot Wheels Premium and MINI GT.",
    areaServed: { "@type": "Country", name: "Bangladesh" },
    ...(sameAs.length ? { sameAs } : {}),
    ...(contact.email || contact.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(contact.email ? { email: contact.email } : {}),
            ...(contact.phone ? { telephone: contact.phone } : {}),
            areaServed: "BD",
          },
        }
      : {}),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DiecastBD",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      {/* Title/description/share-image/GSC token all come from Settings via
          Seo itself now; the token also sits statically in index.html so
          verification never depends on JS rendering. */}
      <Seo>
        <link rel="canonical" href={canonical("/")} />
        <meta property="og:url" content={canonical("/")} />
        <meta property="og:locale" content="en_US" />
      </Seo>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      </Helmet>

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
