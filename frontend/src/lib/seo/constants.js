/** Title/description resolution shared by the React <Seo> component and the
 * build-time prerenderer (scripts/prerender.mjs).
 *
 * WHY this lives outside Seo.jsx: the prerenderer bakes a <head> into the HTML
 * that Google's first (pre-render) pass reads, and React re-renders the same
 * head after hydration. If the two ever disagree, the crawled page and the
 * rendered page describe themselves differently — which is the definition of
 * cloaking, and the kind of drift no code review reliably catches. They can't
 * disagree if they run the same functions.
 *
 * CONSTRAINT: plain Node imports this file directly, so it must stay free of
 * JSX, `@/` aliases, and `import.meta.env`. That is also why callers pass
 * `siteUrl` in rather than importing lib/siteUrl.js.
 */

export const SITE_NAME = "DiecastBD";

// Code-level fallbacks for a fresh install; the merchant's Settings → SEO
// defaults win as soon as they exist.
export const FALLBACK_TITLE = "Hot Wheels, MINI GT & Diecast Cars in Bangladesh | DiecastBD";
export const FALLBACK_DESCRIPTION =
  "Buy authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh. Verified 1:64 collectibles, collector-grade packaging, and nationwide delivery.";

/** The final <title> text: page title templated to "… | DiecastBD" unless
 * `noTemplate`, or the merchant's default when the page passes no title. */
export function resolveTitle({ title, noTemplate = false, settings } = {}) {
  const defaultTitle = settings?.seoDefaults?.title || FALLBACK_TITLE;
  if (!title) return defaultTitle;
  return noTemplate ? title : `${title} | ${SITE_NAME}`;
}

/** `??` not `||` — a page may deliberately pass an empty description. */
export function resolveDescription({ description, settings } = {}) {
  return description ?? (settings?.seoDefaults?.description || FALLBACK_DESCRIPTION);
}

export function resolveImage({ image, settings } = {}) {
  return image ?? settings?.seoDefaults?.shareImage?.url;
}

/** Absolute URL for a path against an explicit origin. Mirrors lib/siteUrl.js
 * `canonical()`, but takes the origin as an argument so Node can call it. */
export function absoluteUrl(siteUrl, path = "") {
  return `${String(siteUrl).replace(/\/$/, "")}${path}`;
}
