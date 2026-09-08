/** One head-model builder per indexable route kind.
 *
 * Each returns the SAME shape, which both consumers render their own way:
 *   - components/shared/Seo.jsx + the page components → react-helmet-async tags
 *   - scripts/prerender.mjs → literal <head> HTML baked into dist/
 *
 * Shape: { title, description, canonical, ogUrl, ogType, image, extraMeta, jsonLd }
 * where `title`/`description` are already FULLY resolved (template applied,
 * settings defaults filled in) so neither consumer re-derives them.
 *
 * Plain Node imports this — no JSX, no `@/` aliases, no import.meta.env.
 * `siteUrl` is always passed in; see lib/seo/constants.js.
 */
import { isOnSale } from "../pricing.js";
import { collectionCopy } from "./collectionCopy.js";
import { SITE_NAME, absoluteUrl, resolveDescription, resolveImage, resolveTitle } from "./constants.js";

export const SHOP_TITLE = "Shop Hot Wheels & MINI GT Diecast Cars in Bangladesh";
export const SHOP_DESCRIPTION =
  "Browse authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh — Car Culture, F1, JDM and more. 1:64 scale, nationwide delivery, cash on delivery.";

/** The three code-authored marketing pages. Their copy lives here so the
 * prerenderer and the components can't drift. */
export const STATIC_PAGE_COPY = {
  about: {
    path: "/about",
    title: "About",
    description: "DiecastBD brings premium 1:64 diecast to Bangladesh — authentic, collector-grade, curated.",
  },
  contact: {
    path: "/contact",
    title: "Contact",
    description: "Talk to a collector — order questions, authenticity checks, or casting hunts.",
  },
  faq: {
    path: "/faq",
    title: "FAQ",
    description: "The questions collectors actually ask — authenticity, delivery, payments, packing, and returns.",
  },
};

/* ------------------------------------------------------------------ home -- */

export function buildOrgJsonLd({ settings, siteUrl }) {
  const social = settings?.socialLinks ?? {};
  const contact = settings?.contactInfo ?? {};
  const sameAs = [social.facebook, social.instagram, social.whatsapp].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/android-chrome-512x512.png`,
    description: "Premium 1:64 diecast collectibles in Bangladesh — authentic Hot Wheels Premium and MINI GT.",
    areaServed: { "@type": "Country", name: "Bangladesh" },
    ...(sameAs.length ? { sameAs } : {}),
    ...(contact.email || contact.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(contact.email ? { email: contact.email } : {}),
            ...(contact.phone ? { telephone: contact.phone } : {}),
            areaServed: "BD",
          },
        }
      : {}),
  };
}

export function buildWebsiteJsonLd({ siteUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildHome({ settings, siteUrl }) {
  const url = absoluteUrl(siteUrl, "/");
  return {
    title: resolveTitle({ settings }),
    description: resolveDescription({ settings }),
    canonical: url,
    ogUrl: url,
    image: resolveImage({ settings }),
    extraMeta: [{ property: "og:locale", content: "en_US" }],
    jsonLd: [buildOrgJsonLd({ settings, siteUrl }), buildWebsiteJsonLd({ siteUrl })],
  };
}

/* ------------------------------------------------------------------ shop -- */

/** A view filtered to exactly one brand or category IS the collection landing
 * page, so it canonicalises there — that's the URL built to rank, and it
 * inherits the signal from links pointing at the query form. Any other
 * combination stays /shop: multi-facet and searched views are app state, not
 * pages worth indexing separately. */
export function shopCanonicalPath(filters = {}) {
  const onlyFacet = (key) => {
    const others = ["brand", "category", "series", "minPrice", "maxPrice", "q"].filter((k) => k !== key);
    return filters[key] && !others.some((k) => filters[k]) && !filters.inStock && !filters.featured && !filters.newArrival;
  };
  if (onlyFacet("brand")) return `/brand/${filters.brand}`;
  if (onlyFacet("category")) return `/category/${filters.category}`;
  return "/shop";
}

export function buildShop({ settings, siteUrl, filters }) {
  const url = absoluteUrl(siteUrl, shopCanonicalPath(filters));
  return {
    title: resolveTitle({ title: SHOP_TITLE, settings }),
    description: resolveDescription({ description: SHOP_DESCRIPTION, settings }),
    canonical: url,
    ogUrl: url,
    image: resolveImage({ settings }),
    jsonLd: [],
  };
}

/* --------------------------------------------------------------- product -- */

/** ShippingDeliveryTime for one zone, or null when the merchant hasn't recorded
 * the numbers. handlingTime is order → courier hand-off; transitTime is time in
 * the courier's hands. Their sum is what a shopper sees, so it must match what
 * the zone's `eta` text promises. Search Console flagged the missing field on
 * 2026-09-06 (plan.md #93); never fabricated, hence the null. */
function deliveryTime(zone) {
  const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
  const hMin = num(zone.handlingDaysMin);
  const hMax = num(zone.handlingDaysMax);
  const tMin = num(zone.transitDaysMin);
  const tMax = num(zone.transitDaysMax);
  if ([hMin, hMax, tMin, tMax].some((v) => v === null || Number.isNaN(v))) return null;

  return {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: hMin, maxValue: hMax, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: tMin, maxValue: tMax, unitCode: "DAY" },
  };
}

export function buildProductJsonLd({ product, settings, siteUrl }) {
  const productUrl = absoluteUrl(siteUrl, `/products/${product.slug}`);
  const price = isOnSale(product) ? product.salePrice : product.price;
  const outOfStock = product.availableStock <= 0;

  // Shipping + returns for Google merchant listings, from the REAL settings —
  // one OfferShippingDetails per configured zone, and a return policy only when
  // the merchant has committed to a window (blank = omitted, never invented).
  const shippingDetails = (settings?.shippingZones ?? [])
    .filter((z) => z?.name)
    .map((z) => ({
      "@type": "OfferShippingDetails",
      name: z.name,
      shippingRate: { "@type": "MonetaryAmount", value: Number(z.fee) || 0, currency: "BDT" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
      // Google asks for numbers, not the `eta` prose — but only emit them when
      // the merchant has actually recorded them for this zone. A zone with no
      // handling/transit days emits no deliveryTime rather than a guess.
      ...(deliveryTime(z) ? { deliveryTime: deliveryTime(z) } : {}),
    }));

  const returnDays = Number(settings?.seoDefaults?.returnWindowDays);
  const returnPolicy =
    returnDays > 0
      ? {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "BD",
          returnPolicyCountry: "BD",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: returnDays,
          // The store ships nationwide and has no walk-in location (it's a
          // service-area business), so a return can only travel back by
          // courier — ReturnByMail is the only fitting schema.org value.
          returnMethod: "https://schema.org/ReturnByMail",
          // Who pays return postage. Merchant-set: the refund policy covers
          // damaged/wrong items but is silent on change-of-mind returns, so
          // this is omitted until the merchant records it rather than guessed.
          ...(settings?.seoDefaults?.returnFees
            ? { returnFees: `https://schema.org/${settings.seoDefaults.returnFees}` }
            : {}),
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    ...(product.modelNumber ? { mpn: product.modelNumber } : {}),
    brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
    image: [product.thumbnail?.url, ...(product.gallery ?? []).map((g) => g.url)].filter(Boolean),
    description: product.description,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price,
      itemCondition: "https://schema.org/NewCondition",
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
      ...(shippingDetails.length ? { shippingDetails } : {}),
      ...(returnPolicy ? { hasMerchantReturnPolicy: returnPolicy } : {}),
    },
  };
}

/** Mirrors the visible breadcrumb — shapes how the URL renders in results. */
export function buildProductBreadcrumbJsonLd({ product, siteUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl(siteUrl, "/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl(siteUrl, "/shop") },
      ...(product.brand?.name
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.brand.name,
              item: absoluteUrl(siteUrl, `/brand/${product.brand.slug}`),
            },
          ]
        : []),
      { "@type": "ListItem", position: product.brand?.name ? 4 : 3, name: product.title },
    ],
  };
}

export function buildProduct({ product, settings, siteUrl }) {
  const productUrl = absoluteUrl(siteUrl, `/products/${product.slug}`);
  return {
    title: resolveTitle({
      title: product.seo?.title ? product.seo.title : `${product.title} — Buy in Bangladesh`,
      noTemplate: !!product.seo?.title,
      settings,
    }),
    description: resolveDescription({
      description:
        product.seo?.description ||
        `Buy the ${product.title} in Bangladesh at DiecastBD. ${product.description?.slice(0, 100) ?? ""}`.slice(0, 160),
      settings,
    }),
    // A merchant-set canonicalUrl overrides the canonical, but og:url always
    // names THIS page — they are different questions.
    canonical: product.seo?.canonicalUrl || productUrl,
    ogUrl: productUrl,
    ogType: "product",
    image: resolveImage({ image: product.thumbnail?.url, settings }),
    jsonLd: [buildProductBreadcrumbJsonLd({ product, siteUrl }), buildProductJsonLd({ product, settings, siteUrl })],
  };
}

/* ------------------------------------------------------------ collection -- */

export function buildCollectionJsonLd({ kind, slug, collection, products = [], total = 0, siteUrl }) {
  const copy = collectionCopy(slug, collection);
  const url = absoluteUrl(siteUrl, `/${kind}/${slug}`);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl(siteUrl, "/") },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
      itemListElement: products.slice(0, 24).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(siteUrl, `/products/${p.slug}`),
        name: p.title,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl(siteUrl, "/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl(siteUrl, "/shop") },
      { "@type": "ListItem", position: 3, name: collection.name },
    ],
  };

  return [collectionJsonLd, breadcrumbJsonLd];
}

/** `kind` is the URL segment: "brand" or "category". */
export function buildCollection({ kind, slug, collection, products, total, settings, siteUrl }) {
  const copy = collectionCopy(slug, collection);
  const url = absoluteUrl(siteUrl, `/${kind}/${slug}`);
  // FAQPage rides along only when the merchant has written real Q&As for this
  // collection (buildFaqJsonLdFromList returns null on empty — never fabricated).
  const faqLd = buildFaqJsonLdFromList(collection.faqs ?? []);
  return {
    title: resolveTitle({ title: copy.title, noTemplate: true, settings }),
    description: resolveDescription({ description: copy.description, settings }),
    canonical: url,
    ogUrl: url,
    ogType: "website",
    image: resolveImage({ image: collection.logo?.url ?? collection.image?.url, settings }),
    jsonLd: [...buildCollectionJsonLd({ kind, slug, collection, products, total, siteUrl }), ...(faqLd ? [faqLd] : [])],
  };
}

/* ---------------------------------------------------------------- CMS page -- */

/** Covers the four policy routes (PageView) and every merchant-built page
 * reached at /:slug (CmsPage) — their head output is identical. */
export function buildCmsPage({ slug, page, settings, siteUrl }) {
  return {
    title: resolveTitle({ title: page.seo?.title || `${page.title} — ${SITE_NAME}`, noTemplate: true, settings }),
    description: resolveDescription({ description: page.seo?.description || undefined, settings }),
    canonical: page.seo?.canonicalUrl || absoluteUrl(siteUrl, `/${slug}`),
    ogUrl: absoluteUrl(siteUrl, `/${slug}`),
    // Guides and policy pages are documents, not storefronts — og:type article
    // plus a real modified time (the sitemap already emits it as lastmod).
    ogType: "article",
    image: resolveImage({ settings }),
    extraMeta: page.updatedAt
      ? [{ property: "article:modified_time", content: new Date(page.updatedAt).toISOString() }]
      : [],
    jsonLd: [],
  };
}

/* ------------------------------------------------------- static marketing -- */

/** FAQPage JSON-LD from any list of real Q&As — the site-wide /faq page passes
 * settings.faqs, collection landing pages pass their own. Honest caveat,
 * recorded in plan.md #91: Google has shown FAQ rich results almost only for
 * government/health sites since 2023, so the on-page FAQ TEXT is the value
 * (it answers the long-tail queries); the schema is a cheap consistency bonus,
 * not a CTR play. */
export function buildFaqJsonLdFromList(faqs = []) {
  const mainEntity = faqs
    .filter((f) => f?.question && f?.answer)
    .map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    }));
  // No content = no schema (never fabricate to match a mock).
  if (!mainEntity.length) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity };
}

export function buildFaqJsonLd({ settings }) {
  return buildFaqJsonLdFromList(settings?.faqs ?? []);
}

/** `key` is one of the STATIC_PAGE_COPY keys: "about" | "contact" | "faq". */
export function buildStaticPage({ key, settings, siteUrl }) {
  const copy = STATIC_PAGE_COPY[key];
  const url = absoluteUrl(siteUrl, copy.path);
  const faq = key === "faq" ? buildFaqJsonLd({ settings }) : null;
  return {
    title: resolveTitle({ title: copy.title, settings }),
    description: resolveDescription({ description: copy.description, settings }),
    canonical: url,
    ogUrl: url,
    image: resolveImage({ settings }),
    jsonLd: faq ? [faq] : [],
  };
}
