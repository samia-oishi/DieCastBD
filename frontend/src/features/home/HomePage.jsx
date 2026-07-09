import { Helmet } from "react-helmet-async";

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

  return (
    <>
      <Helmet>
        <title>{settings?.seoDefaults?.title ?? "DiecastBD — Premium Diecast Collectibles"}</title>
        <meta
          name="description"
          content={
            settings?.seoDefaults?.description ??
            "Authentic Hot Wheels Premium and MINI GT diecast, curated for collectors in Bangladesh."
          }
        />
      </Helmet>

      <HeroSection slides={settings?.heroBanner} />

      <ProductCarouselSection
        title="Collector Picks"
        subtitle="The pieces we'd add to our own shelf first."
        products={collectorPicks.data?.data}
        isLoading={collectorPicks.isLoading}
      />

      <ProductCarouselSection
        title="Featured Products"
        products={featured.data?.data}
        isLoading={featured.isLoading}
      />

      <BrandsStrip brands={brands} />

      <ProductCarouselSection
        title="New Arrivals"
        subtitle="Just landed from the latest import batch."
        products={newArrivals.data?.data}
        isLoading={newArrivals.isLoading}
      />

      <WhyChooseUsSection items={settings?.whyChooseUs} />
      <CollectorPromiseSection
        title={settings?.collectorPromise?.title}
        description={settings?.collectorPromise?.description}
      />
      <TestimonialsSection testimonials={settings?.testimonials} />
      <InstagramPlaceholder instagramUrl={settings?.socialLinks?.instagram} />
      <NewsletterSection />
    </>
  );
}
