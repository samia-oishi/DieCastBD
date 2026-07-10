import { Helmet } from "react-helmet-async";

import { canonical } from "@/lib/siteUrl";
import { Container } from "@/components/shared/Container";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { usePage } from "./api/usePages";

// Shared renderer for every static CMS page (Terms/Privacy/Refund/Shipping
// Policy) — one component, four routes, each just passing a different slug.
// `content` is HTML sanitized server-side on save (page.controller.js), so
// rendering it here is safe.
export function PageView({ slug }) {
  const { data: page, isLoading, isError } = usePage(slug);

  if (isLoading) return <FullPageLoader />;
  if (isError || !page) return <NotFoundPage />;

  return (
    <>
      <Helmet>
        <title>{page.seo?.title || `${page.title} — DiecastBD`}</title>
        {page.seo?.description && <meta name="description" content={page.seo.description} />}
        <link rel="canonical" href={page.seo?.canonicalUrl || canonical(`/${slug}`)} />
      </Helmet>

      <Container size="narrow" className="flex flex-col gap-6 py-16">
        <h1 className="font-heading text-3xl text-foreground sm:text-4xl">{page.title}</h1>
        <div
          className="flex flex-col gap-4 leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:font-heading [&_h3]:text-lg [&_h3]:text-foreground [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </Container>
    </>
  );
}
