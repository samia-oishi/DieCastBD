import { Helmet } from "react-helmet-async";

import { SITE_URL, canonical } from "@/lib/siteUrl";
import { ROUTES } from "@/constants/routes";
import { Seo } from "@/components/shared/Seo";
import { ProductCarousel } from "@/components/shared/ProductCarousel";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts } from "@/features/products/api/useProducts";
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
  const { data: settings } = useSettings();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  const featured = useProducts({ featured: true, limit: 4 });
  const newArrivals = useProducts({ newArrival: true, limit: 8, sort: "newest" });
  const collectorPicks = useProducts({ hero: true, limit: 8 });

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
    logo: `${SITE_URL}/favicon.svg`,
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
      <Seo title={settings?.seoDefaults?.title} noTemplate={!!settings?.seoDefaults?.title} description={settings?.seoDefaults?.description}>
        <link rel="canonical" href={canonical("/")} />
        <meta property="og:url" content={canonical("/")} />
        <meta property="og:locale" content="en_US" />
        <meta name="google-site-verification" content="-hHjBqUWtYFIZPNE0dU9_IpFGrDEtokHS8PvupLBwzE" />
      </Seo>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      </Helmet>

      {isEnabled("hero") && (
        <HeroSection
          variant={hero?.variant}
          image={settings?.heroBanner?.[0]?.image}
          highlightCard={hero?.highlightCard}
          content={hero?.content?.[HERO_CONTENT_KEY[hero?.variant] ?? "limeShowroom"]}
        />
      )}

      {isEnabled("brandsStrip") && <ShopByShelf tiles={settings?.shopByShelf} brands={brands} categories={categories} />}

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

      {isEnabled("featuredProducts") && <FeaturedSpotlight products={featured.data?.data} />}

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
      {isEnabled("testimonials") && <TestimonialsSection testimonials={settings?.testimonials} />}
    </div>
  );
}
