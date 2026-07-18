import { Helmet } from "react-helmet-async";

import { useSettings } from "@/features/settings/api/useSettings";

const SITE_NAME = "DiecastBD";

// Code-level fallbacks for a fresh install; the merchant's Settings → SEO
// defaults win as soon as they exist.
const FALLBACK_TITLE = "Hot Wheels, MINI GT & Diecast Cars in Bangladesh | DiecastBD";
const FALLBACK_DESCRIPTION =
  "Buy authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh. Verified 1:64 collectibles, collector-grade packaging, and nationwide delivery.";

/** One Helmet wrapper for every storefront page.
 *
 * Pass a page `title` (appended as "… | DiecastBD" unless `noTemplate`) and
 * optional `description`/`image`; omit them for the merchant's SEO defaults
 * from Settings (falling back to the shipped copy above). The share image and
 * Search Console token render site-wide from Settings — pages never have to
 * remember them.
 *
 * Honest limitation, recorded in plan.md #91: these tags are injected by JS,
 * which Google renders but Facebook/WhatsApp crawlers do not — THEIR fallbacks
 * live in the static index.html (og:image via the /share-image redirect).
 */
export function Seo({ title, description, image, noTemplate = false, children }) {
  const { data: settings } = useSettings();
  const seo = settings?.seoDefaults;

  const defaultTitle = seo?.title || FALLBACK_TITLE;
  const fullTitle = !title ? defaultTitle : noTemplate ? title : `${title} | ${SITE_NAME}`;
  const desc = description ?? (seo?.description || FALLBACK_DESCRIPTION);
  const shareImage = image ?? seo?.shareImage?.url;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {shareImage && <meta property="og:image" content={shareImage} />}
      {shareImage && <meta name="twitter:image" content={shareImage} />}
      {seo?.googleSiteVerification && <meta name="google-site-verification" content={seo.googleSiteVerification} />}
      {children}
    </Helmet>
  );
}
