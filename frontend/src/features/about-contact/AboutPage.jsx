import { Helmet } from "react-helmet-async";

import { Container } from "@/components/shared/Container";
import { WhyChooseUsSection } from "@/features/home/components/WhyChooseUsSection";
import { useSettings } from "@/features/settings/api/useSettings";

export function AboutPage() {
  const { data: settings } = useSettings();

  return (
    <>
      <Helmet>
        <title>About Us — DiecastBD</title>
        <meta
          name="description"
          content="DiecastBD is a premium diecast collectibles retailer in Bangladesh, specializing in Hot Wheels Premium and MINI GT."
        />
      </Helmet>

      <Container size="narrow" className="flex flex-col gap-6 py-16 text-center">
        <h1 className="font-heading text-3xl text-foreground sm:text-4xl">About DiecastBD</h1>
        <p className="text-balance leading-relaxed text-muted-foreground">
          DiecastBD brings premium 1:64 scale diecast collectibles to Bangladesh — starting with Hot Wheels
          Premium and MINI GT, with more collector-grade brands to follow. We built DiecastBD because
          collectors here deserve the same access, authenticity, and care that collectors anywhere else in
          the world expect.
        </p>
        {settings?.collectorPromise?.title && (
          <div className="mt-4 flex flex-col gap-3">
            <h2 className="font-heading text-xl text-foreground">{settings.collectorPromise.title}</h2>
            <p className="text-balance leading-relaxed text-muted-foreground">
              {settings.collectorPromise.description}
            </p>
          </div>
        )}
      </Container>

      <WhyChooseUsSection items={settings?.whyChooseUs} />
    </>
  );
}
