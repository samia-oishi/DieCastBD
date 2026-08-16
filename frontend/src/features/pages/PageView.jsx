import { Link } from "react-router";

import { cn } from "@/lib/utils";
import { PROSE } from "@/components/shared/prose";
import { SITE_URL } from "@/lib/siteUrl";
import { buildCmsPage } from "@/lib/seo/routes";
import { ROUTES } from "@/constants/routes";
import { SeoHead } from "@/components/shared/Seo";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { PageLoadError } from "@/components/shared/PageLoadError";
import { useSettings } from "@/features/settings/api/useSettings";
import { usePage } from "./api/usePages";
import { BlockRenderer } from "./components/BlockRenderer";

// The 4 flat policy routes, in the design's switcher order.
const POLICIES = [
  { slug: "shipping-policy", label: "Shipping", to: ROUTES.SHIPPING_POLICY },
  { slug: "refund-policy", label: "Refunds", to: ROUTES.REFUND_POLICY },
  { slug: "privacy-policy", label: "Privacy", to: ROUTES.PRIVACY },
  { slug: "terms-conditions", label: "Terms", to: ROUTES.TERMS },
];

function formatUpdated(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Shared renderer for every static CMS page (Terms/Privacy/Refund/Shipping
// Policy) — one component, four routes, each passing a different slug. The
// policy BODY is CMS-authored HTML only (sanitized server-side on save); we
// never hardcode policy copy from the design.
export function PageView({ slug }) {
  const { data: page, isLoading, isError, error } = usePage(slug);
  const { data: settings } = useSettings();

  if (isLoading) return <FullPageLoader />;
  // Only a real 404 means "this page doesn't exist". Any other failure is
  // transient, and NotFoundPage carries noindex — see PageLoadError.
  if (isError && error?.response?.status !== 404) return <PageLoadError />;
  if (!page) return <NotFoundPage />;

  const updated = formatUpdated(page.updatedAt);
  const hasContent = page.content && page.content.trim().length > 0;

  return (
    <>
      <SeoHead model={buildCmsPage({ slug, page, settings, siteUrl: SITE_URL })} />

      <div className="mx-auto w-full max-w-[760px] px-4 pb-10 pt-8 md:px-6 md:pt-11">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-deep">Policy</div>
        <h1 className="mt-3 font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink md:text-[clamp(28px,4vw,36px)]">{page.title}</h1>
        {updated && <div className="mt-2 text-[13px] text-faint">Last updated {updated}</div>}

        {/* policy switcher */}
        <div className="mt-5 flex flex-wrap gap-2">
          {POLICIES.map((p) => {
            const active = p.slug === slug;
            return (
              <Link
                key={p.slug}
                to={p.to}
                className={cn(
                  "rounded-full px-[15px] py-2 text-[12.5px] font-semibold transition-colors",
                  active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink"
                )}
              >
                {p.label}
              </Link>
            );
          })}
        </div>

        {/* TL;DR — only when the CMS provides it (never hardcoded) */}
        {page.tldr && (
          <div className="mt-6 rounded-[18px] border border-brand-soft-border bg-brand-soft p-[18px_20px]">
            <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-brand-deep">The short version</div>
            <div className="mt-2.5 whitespace-pre-line text-[13.5px] leading-[1.55] text-ink-soft">{page.tldr}</div>
          </div>
        )}

        {/* Blocks first, then the rich-text body — a page can use either or both,
            and the block builder is where new pages are laid out. */}
        <BlockRenderer blocks={page.blocks} products={page.blockProducts} className="mt-8" />

        {hasContent ? (
          <div className={cn("mt-8", PROSE)} dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (page.blocks ?? []).length > 0 ? null : (
          <p className="mt-8 text-[14.5px] leading-[1.7] text-muted-foreground">
            This policy hasn't been published yet. Reach out via our{" "}
            <Link to={ROUTES.CONTACT} className="font-semibold text-brand-deep">contact page</Link> and we'll help directly.
          </p>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-between gap-4 rounded-[18px] bg-ink p-[20px_22px]">
          <div className="text-[13.5px] text-[#C7C9BC]">Question about your order? Message us with your order ID.</div>
          <Link to={ROUTES.CONTACT} className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-brand-bright">
            Contact us
          </Link>
        </div>
      </div>
    </>
  );
}
