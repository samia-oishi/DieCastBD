import { Helmet } from "react-helmet-async";
import { useParams } from "react-router";

import { cn } from "@/lib/utils";
import { canonical } from "@/lib/siteUrl";
import { Container } from "@/components/shared/Container";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { usePage } from "./api/usePages";
import { BlockRenderer } from "./components/BlockRenderer";

const PROSE =
  "flex flex-col gap-3 text-[14.5px] leading-[1.7] text-ink-soft [&_a]:font-semibold [&_a]:text-brand-deep [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-[17.5px] [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-4 [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-ink [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc";

/** Any merchant-built CMS page, reached at `/<slug>`.
 *
 * The four policy pages keep their own route and `PageView` (they carry the
 * policy switcher and TL;DR card). This is the generic surface for pages built
 * in the block builder — promo pages, guides, a drop announcement.
 *
 * An unknown slug renders the normal 404, so this catch-all doesn't change what
 * a mistyped URL does.
 */
export function CmsPage() {
  const { slug } = useParams();
  const { data: page, isLoading, isError } = usePage(slug);

  if (isLoading) return <FullPageLoader />;
  if (isError || !page) return <NotFoundPage />;

  const blocks = page.blocks ?? [];
  const hasContent = page.content && page.content.trim().length > 0;

  return (
    <>
      <Helmet>
        <title>{page.seo?.title || `${page.title} — DiecastBD`}</title>
        {page.seo?.description && <meta name="description" content={page.seo.description} />}
        <link rel="canonical" href={page.seo?.canonicalUrl || canonical(`/${slug}`)} />
      </Helmet>

      <Container className="pb-14 pt-8 md:pt-11">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink md:text-[clamp(28px,4vw,36px)]">
          {page.title}
        </h1>

        <BlockRenderer blocks={blocks} products={page.blockProducts} className="mt-8" />

        {hasContent && <div className={cn("mt-8 max-w-[760px]", PROSE)} dangerouslySetInnerHTML={{ __html: page.content }} />}

        {blocks.length === 0 && !hasContent && (
          <p className="mt-8 text-[14.5px] leading-[1.7] text-muted-foreground">This page has no content yet.</p>
        )}
      </Container>
    </>
  );
}
