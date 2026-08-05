import { Helmet } from "react-helmet-async";

import { resolveDescription, resolveImage, resolveTitle } from "@/lib/seo/constants";
import { useSettings } from "@/features/settings/api/useSettings";

/** Renders a fully-resolved head model (see lib/seo/routes.js) as Helmet tags.
 *
 * This is the React half of a pair: scripts/prerender.mjs renders the SAME
 * model to literal HTML at build time via lib/seo/injectHead.js. Pages build a
 * model with a `build*` helper and hand it here, so the crawled page and the
 * rendered page can never describe themselves differently.
 *
 * The share image and Search Console token come from Settings site-wide — pages
 * never have to remember them.
 */
export function SeoHead({ model, noindex = false, children }) {
  const { data: settings } = useSettings();
  const verification = settings?.seoDefaults?.googleSiteVerification;
  const jsonLd = (model.jsonLd ?? []).filter(Boolean);

  return (
    <>
      <Helmet>
        {model.title && <title>{model.title}</title>}
        {model.description && <meta name="description" content={model.description} />}
        {model.title && <meta property="og:title" content={model.title} />}
        {model.description && <meta property="og:description" content={model.description} />}
        {model.canonical && <link rel="canonical" href={model.canonical} />}
        {model.ogUrl && <meta property="og:url" content={model.ogUrl} />}
        {model.ogType && <meta property="og:type" content={model.ogType} />}
        {model.image && <meta property="og:image" content={model.image} />}
        {model.image && <meta name="twitter:image" content={model.image} />}
        {(model.extraMeta ?? []).map((m) =>
          m.name ? (
            <meta key={m.name} name={m.name} content={m.content} />
          ) : (
            <meta key={m.property} property={m.property} content={m.content} />
          )
        )}
        {noindex && <meta name="robots" content="noindex" />}
        {verification && <meta name="google-site-verification" content={verification} />}
        {children}
      </Helmet>
      {jsonLd.length > 0 && (
        <Helmet>
          {jsonLd.map((block, i) => (
            // eslint-disable-next-line react/no-array-index-key -- position IS the identity here
            <script key={i} type="application/ld+json">
              {JSON.stringify(block)}
            </script>
          ))}
        </Helmet>
      )}
    </>
  );
}

/** Prop-driven wrapper for pages with no structured data of their own.
 *
 * Pass a page `title` (appended as "… | DiecastBD" unless `noTemplate`) and
 * optional `description`/`image`; omit them for the merchant's Settings → SEO
 * defaults. `noindex` marks a page that must stay out of the index — see
 * plan.md #95: robots.txt Disallow can't do this job, because Google has to be
 * allowed to CRAWL a URL in order to see the noindex that removes it.
 *
 * Honest limitation, recorded in plan.md #91: these tags are injected by JS,
 * which Google renders but Facebook/WhatsApp crawlers do not. For the routes
 * that matter, scripts/prerender.mjs bakes the same tags into the HTML; every
 * other route falls back to the static ones in index.html.
 */
export function Seo({ title, description, image, noTemplate = false, noindex = false, children }) {
  const { data: settings } = useSettings();

  const model = {
    title: resolveTitle({ title, noTemplate, settings }),
    description: resolveDescription({ description, settings }),
    image: resolveImage({ image, settings }),
  };

  return (
    <SeoHead model={model} noindex={noindex}>
      {children}
    </SeoHead>
  );
}
