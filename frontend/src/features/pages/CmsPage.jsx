import { useParams } from "react-router";

import { cn } from "@/lib/utils";
import { PROSE } from "@/components/shared/prose";
import { SITE_URL } from "@/lib/siteUrl";
import { buildCmsPage } from "@/lib/seo/routes";
import { SeoHead } from "@/components/shared/Seo";
import { Container } from "@/components/shared/Container";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { PageLoadError } from "@/components/shared/PageLoadError";
import { useSettings } from "@/features/settings/api/useSettings";
import { usePage } from "./api/usePages";
import { BlockRenderer } from "./components/BlockRenderer";

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
  const { data: page, isLoading, isError, error } = usePage(slug);
  const { data: settings } = useSettings();

  if (isLoading) return <FullPageLoader />;
  // Only a real 404 means "no such page" — anything else is transient, and
  // NotFoundPage carries noindex. See PageLoadError.
  if (isError && error?.response?.status !== 404) return <PageLoadError />;
  if (!page) return <NotFoundPage />;

  const blocks = page.blocks ?? [];
  const hasContent = page.content && page.content.trim().length > 0;

  return (
    <>
      <SeoHead model={buildCmsPage({ slug, page, settings, siteUrl: SITE_URL })} />

      <Container className="pb-14 pt-8 md:pt-11">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink md:text-[clamp(28px,4vw,36px)]">
          {page.title}
        </h1>
        {/* Real freshness signal for guides — matches the article:modified_time
            the head emits. No author byline: single-merchant store, and an
            invented persona would violate the no-fabrication rule. */}
        {page.updatedAt && (
          <div className="mt-2 text-[13px] text-faint">
            Updated {new Date(page.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
        )}

        <BlockRenderer blocks={blocks} products={page.blockProducts} className="mt-8" />

        {hasContent && <div className={cn("mt-8 max-w-[760px]", PROSE)} dangerouslySetInnerHTML={{ __html: page.content }} />}

        {blocks.length === 0 && !hasContent && (
          <p className="mt-8 text-[14.5px] leading-[1.7] text-muted-foreground">This page has no content yet.</p>
        )}
      </Container>
    </>
  );
}
