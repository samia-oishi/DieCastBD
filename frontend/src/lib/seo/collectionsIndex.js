/** The /collections hub: head model + baked BODY for the one page whose job is
 * to put real <a href> links into raw HTML.
 *
 * WHY a baked body exists at all: the prerenderer bakes <head> only, so every
 * page body in served HTML is an empty <div id="root"> — zero anchors anywhere
 * on the site. The sitemap was the ONLY signal telling Google our URLs exist,
 * and Search Console showed the entire catalogue sitting in "Discovered –
 * currently not indexed", never crawled. Sitemap-only URLs with no internal
 * links stalling exactly there is a well-known pattern; this page is the fix.
 *
 * WHY the baked body is NOT tagged data-prerendered: main.jsx strips tagged
 * elements before React's first render. Head tags must hand off (helmet
 * appends, so duplicates would result) — but body content is REPLACED wholesale
 * by createRoot's first commit, so untagged content simply stays visible until
 * React paints the same lists. Longest visibility, no duplication, no mismatch
 * (createRoot replaces; it never hydrates).
 *
 * Node imports this file — no JSX, no @/ aliases, no import.meta.env.
 */
import { escapeAttr, escapeText } from "./injectHead.js";
import { formatTaka } from "../currency.js";
import { isOnSale } from "../pricing.js";
import { collectionCopy } from "./collectionCopy.js";
import { SITE_NAME, absoluteUrl, resolveDescription, resolveImage, resolveTitle } from "./constants.js";

export const COLLECTIONS_TITLE = "All Collections & Products";
export const COLLECTIONS_DESCRIPTION =
  "Browse the full DiecastBD catalogue — every Hot Wheels Premium and MINI GT diecast, multi-packs and accessories in stock in Bangladesh, on one page.";

export function buildCollectionsIndex({ settings, siteUrl }) {
  const url = absoluteUrl(siteUrl, "/collections");
  return {
    title: resolveTitle({ title: COLLECTIONS_TITLE, settings }),
    description: resolveDescription({ description: COLLECTIONS_DESCRIPTION, settings }),
    canonical: url,
    ogUrl: url,
    image: resolveImage({ settings }),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl(siteUrl, "/") },
          { "@type": "ListItem", position: 2, name: COLLECTIONS_TITLE },
        ],
      },
    ],
  };
}

const link = (href, label) => `<a href="${escapeAttr(href)}">${escapeText(label)}</a>`;

function section(title, items) {
  if (!items.length) return "";
  return `<section><h2>${escapeText(title)}</h2><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></section>`;
}

/** Baked body for /brand/<slug> and /category/<slug> — H1, intro, product
 * links, the merchant's landing content and FAQ text as raw HTML, so the money
 * pages carry real substance before JS runs (their raw HTML previously had no
 * H1 and zero links). `collection.content` arrives ALREADY sanitized by the
 * backend (utils/sanitizeContent.js) and is embedded as-is; everything else is
 * escaped here. Same handoff rule as the hub: untagged, replaced wholesale by
 * React's first paint. */
export function renderCollectionBody({ copy, collection, products = [], total = 0 }) {
  const faqs = (collection.faqs ?? []).filter((f) => f?.question && f?.answer);
  const parts = [
    `<main style="max-width:760px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif">`,
    `<h1>${escapeText(copy.title)}</h1>`,
    `<p>${escapeText(copy.description)}</p>`,
    collection.description ? `<p>${escapeText(collection.description)}</p>` : "",
    section(
      total > products.length ? `Products (${products.length} of ${total})` : "Products",
      products.map((p) => link(`/products/${p.slug}`, p.title))
    ),
    collection.content || "",
    faqs.length
      ? `<section><h2>Frequently asked questions</h2>${faqs
          .map((f) => `<h3>${escapeText(f.question)}</h3><p>${escapeText(f.answer)}</p>`)
          .join("")}</section>`
      : "",
    `<p>${link("/collections", "Browse all collections & products")}</p>`,
    `</main>`,
  ];
  return parts.filter(Boolean).join("\n");
}

/** Baked body for /products/<slug>.
 *
 * WHY products need this most: URL Inspection on a product showed
 * "Referring page: None detected" and "Last crawl: N/A" — Google knew the URL
 * from the sitemap alone, had never fetched it, and would have found an empty
 * <div id="root"> if it had. Products are the pages that must rank for
 * "<casting> price in bangladesh" queries, so they get an H1, the real price,
 * stock state, the description, and — just as important — outbound links to
 * their brand and to /collections, which turns the catalogue from a flat list
 * of orphans into a connected graph.
 *
 * Prices and stock here are baked at build time; the React render replaces
 * them with live values on first paint. That is the accepted trade recorded in
 * plan.md #91 (rebuilds are manual by merchant decision), and Google renders JS
 * so it sees the live figures — the baked numbers serve the pre-render pass.
 */
export function renderProductBody({ product, siteUrl }) {
  const onSale = isOnSale(product);
  const price = onSale ? product.salePrice : product.price;
  const inStock = (product.availableStock ?? 0) > 0;
  const brand = product.brand;

  const crumbs = [
    link("/", "Home"),
    link("/shop", "Shop"),
    brand?.slug ? link(`/brand/${brand.slug}`, brand.name) : "",
  ].filter(Boolean);

  const paragraphs = String(product.description ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeText(p)}</p>`)
    .join("");

  const parts = [
    `<main style="max-width:760px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif">`,
    `<nav>${crumbs.join(" › ")}</nav>`,
    `<h1>${escapeText(product.title)}</h1>`,
    `<p><strong>${escapeText(formatTaka(price))}</strong>${
      onSale ? ` <span>(was ${escapeText(formatTaka(product.price))})</span>` : ""
    } — ${inStock ? "In stock" : "Out of stock"}${
      product.sku ? ` · SKU ${escapeText(product.sku)}` : ""
    }</p>`,
    paragraphs,
    product.series ? `<p>Series: ${escapeText(product.series)}</p>` : "",
    `<p>Cash on delivery · nationwide shipping across Bangladesh.</p>`,
    brand?.slug ? `<p>${link(`/brand/${brand.slug}`, `More ${brand.name} in Bangladesh`)}</p>` : "",
    `<p>${link("/collections", "Browse all collections & products")}</p>`,
    `</main>`,
  ];
  return parts.filter(Boolean).join("\n");
}

/** The crawlable body. Semantic, unstyled-beyond-defaults HTML on purpose —
 * it shows only until React's first paint, and its audience is crawlers and
 * the reader who lands with JS still loading. Every entry is a REAL catalogue
 * record passed in from the API; nothing here is invented. */
export function renderCollectionsIndexBody({ brands = [], categories = [], products = [], pages = [] }) {
  const parts = [
    `<main style="max-width:760px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif">`,
    `<h1>${escapeText(COLLECTIONS_TITLE)}</h1>`,
    `<p>${escapeText(COLLECTIONS_DESCRIPTION)}</p>`,
    section("Brands", brands.map((b) => link(`/brand/${b.slug}`, `${b.name} in Bangladesh`))),
    section("Categories", categories.map((c) => link(`/category/${c.slug}`, `${c.name} in Bangladesh`))),
    section("All products", products.map((p) => link(`/products/${p.slug}`, p.title))),
    section("Guides", pages.map((g) => link(`/${g.slug}`, g.title))),
    `<p>${link("/shop", `Shop the full ${SITE_NAME} catalogue`)}</p>`,
    `</main>`,
  ];
  return parts.filter(Boolean).join("\n");
}
