import { Helmet } from "react-helmet-async";

import { SITE_URL, canonical } from "@/lib/siteUrl";
import { ROUTES } from "@/constants/routes";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts } from "@/features/products/api/useProducts";
import { useBrands } from "@/features/brands/api/useBrands";
import { HeroSection } from "./components/HeroSection";
import { ProductCarouselSection } from "@/components/shared/ProductCarouselSection";
import { BrandsStrip } from "./components/BrandsStrip";
import { WhyChooseUsSection } from "./components/WhyChooseUsSection";
import { CollectorPromiseSection } from "./components/CollectorPromiseSection";
import { InstagramPlaceholder } from "./components/InstagramPlaceholder";
import { NewsletterSection } from "./components/NewsletterSection";
import { TestimonialsSection } from "./components/TestimonialsSection";

export function HomePage() {
  const { data: settings } = useSettings();
  const { data: brands } = useBrands();

  const featured = useProducts({ featured: true, limit: 8 });
  const newArrivals = useProducts({ newArrival: true, limit: 8, sort: "newest" });
  const collectorPicks = useProducts({ hero: true, limit: 8 });

  // Defaults to enabled — a document that predates this field (or hasn't been
  // re-seeded) must not make every section disappear.
  const sections = settings?.homepageSections;
  const isEnabled = (key) => sections?.[key]?.enabled ?? true;

  const social = settings?.socialLinks ?? {};
  const contact = settings?.contactInfo ?? {};
  const sameAs = [social.facebook, social.instagram, social.whatsapp].filter(Boolean);

  // Identifies DiecastBD as a Bangladesh online store to search engines (areaServed BD)
  // and declares the on-site product search so Google can offer a sitelinks search box.
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "DiecastBD",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      "Premium 1:64 diecast collectibles in Bangladesh — authentic Hot Wheels Premium and MINI GT.",
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
    <>
      <Helmet>
        <title>
          {settings?.seoDefaults?.title ?? "Hot Wheels, MINI GT & Diecast Cars in Bangladesh | DiecastBD"}
        </title>
        <meta
          name="description"
          content={
            settings?.seoDefaults?.description ??
            "Buy authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh. Verified 1:64 collectibles, collector-grade packaging, and nationwide delivery."
          }
        />
        <link rel="canonical" href={canonical("/")} />
        <meta property="og:url" content={canonical("/")} />
        <meta property="og:locale" content="en_US" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      </Helmet>

      {isEnabled("hero") && (
        <HeroSection
          slides={settings?.heroBanner}
          autoplay={sections?.hero?.autoplay ?? true}
          autoplayInterval={sections?.hero?.autoplayInterval ?? 6}
        />
      )}

      {isEnabled("collectorPicks") && (
        <ProductCarouselSection
          title="Collector Picks"
          subtitle="The pieces we'd add to our own shelf first."
          products={collectorPicks.data?.data}
          isLoading={collectorPicks.isLoading}
          seeAllHref={ROUTES.SHOP}
        />
      )}

      {isEnabled("featuredProducts") && (
        <ProductCarouselSection
          title="Featured Products"
          products={featured.data?.data}
          isLoading={featured.isLoading}
          seeAllHref={ROUTES.SHOP}
        />
      )}

      {isEnabled("brandsStrip") && <BrandsStrip brands={brands} />}

      {isEnabled("newArrivals") && (
        <ProductCarouselSection
          title="New Arrivals"
          subtitle="Just landed from the latest import batch."
          products={newArrivals.data?.data}
          isLoading={newArrivals.isLoading}
          seeAllHref={ROUTES.SHOP}
        />
      )}

      {isEnabled("whyChooseUs") && <WhyChooseUsSection items={settings?.whyChooseUs} />}
      {isEnabled("collectorPromise") && (
        <CollectorPromiseSection
          title={settings?.collectorPromise?.title}
          description={settings?.collectorPromise?.description}
        />
      )}
      {isEnabled("testimonials") && <TestimonialsSection testimonials={settings?.testimonials} />}
      {isEnabled("instagramFeed") && (
        <InstagramPlaceholder instagramUrl={settings?.socialLinks?.instagram} />
      )}
      {isEnabled("newsletter") && <NewsletterSection />}
    </>
  );
}
