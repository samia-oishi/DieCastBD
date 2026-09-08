import { describe, expect, it } from "vitest";

import { FALLBACK_DESCRIPTION, FALLBACK_TITLE } from "./constants";
import {
  buildCmsPage,
  buildCollection,
  buildFaqJsonLd,
  buildHome,
  buildProduct,
  buildShop,
  buildStaticPage,
  shopCanonicalPath,
} from "./routes";

const SITE = "https://diecastbd.com";
const settings = {
  seoDefaults: { title: "Merchant default title", description: "Merchant default description" },
};

describe("buildProduct", () => {
  const product = {
    slug: "mazda-rx-7",
    title: "MINI GT Mazda RX-7",
    sku: "MGT-1046",
    price: 1290,
    salePrice: 0,
    availableStock: 4,
    description: "A".repeat(300),
    thumbnail: { url: "https://cdn/x.jpg" },
    brand: { name: "MINI GT", slug: "mini-gt" },
  };

  it("templates the generated title and self-canonicalises", () => {
    const m = buildProduct({ product, settings, siteUrl: SITE });
    expect(m.title).toBe("MINI GT Mazda RX-7 — Buy in Bangladesh | DiecastBD");
    expect(m.canonical).toBe(`${SITE}/products/mazda-rx-7`);
    expect(m.ogUrl).toBe(m.canonical);
    expect(m.ogType).toBe("product");
    expect(m.image).toBe("https://cdn/x.jpg");
  });

  it("uses a merchant seo.title verbatim, with no ' | DiecastBD' suffix", () => {
    const m = buildProduct({ product: { ...product, seo: { title: "Custom" } }, settings, siteUrl: SITE });
    expect(m.title).toBe("Custom");
  });

  it("truncates only the GENERATED description, never the merchant's", () => {
    // The `.slice(0, 160)` binds to the template literal alone — a subtlety the
    // prerenderer has to reproduce exactly or baked and hydrated heads diverge.
    const generated = buildProduct({ product: { ...product, title: "T".repeat(120) }, settings, siteUrl: SITE });
    expect(generated.description).toHaveLength(160);

    const short = buildProduct({ product, settings, siteUrl: SITE });
    expect(short.description.length).toBeLessThanOrEqual(160);
    expect(short.description).toContain("Buy the MINI GT Mazda RX-7 in Bangladesh at DiecastBD.");

    const long = "M".repeat(300);
    const merchant = buildProduct({ product: { ...product, seo: { description: long } }, settings, siteUrl: SITE });
    expect(merchant.description).toBe(long);
  });

  it("lets seo.canonicalUrl override the canonical but never og:url", () => {
    const m = buildProduct({
      product: { ...product, seo: { canonicalUrl: "https://example.com/other" } },
      settings,
      siteUrl: SITE,
    });
    expect(m.canonical).toBe("https://example.com/other");
    expect(m.ogUrl).toBe(`${SITE}/products/mazda-rx-7`);
  });

  it("reports availability and the effective sale price in JSON-LD", () => {
    const onSale = buildProduct({ product: { ...product, salePrice: 990 }, settings, siteUrl: SITE });
    const offer = onSale.jsonLd.find((b) => b["@type"] === "Product").offers;
    expect(offer.price).toBe(990);
    expect(offer.availability).toBe("https://schema.org/InStock");

    const out = buildProduct({ product: { ...product, availableStock: 0 }, settings, siteUrl: SITE });
    expect(out.jsonLd.find((b) => b["@type"] === "Product").offers.availability).toBe(
      "https://schema.org/OutOfStock"
    );
  });

  it("omits a return policy unless the merchant committed to a window", () => {
    const without = buildProduct({ product, settings, siteUrl: SITE });
    expect(without.jsonLd.find((b) => b["@type"] === "Product").offers.hasMerchantReturnPolicy).toBeUndefined();

    const withPolicy = buildProduct({
      product,
      settings: { seoDefaults: { ...settings.seoDefaults, returnWindowDays: 7 } },
      siteUrl: SITE,
    });
    expect(
      withPolicy.jsonLd.find((b) => b["@type"] === "Product").offers.hasMerchantReturnPolicy.merchantReturnDays
    ).toBe(7);
  });
});

describe("merchant listing fields (Search Console 2026-09-06)", () => {
  const product = { slug: "x", title: "X", sku: "S", price: 100, salePrice: 0, availableStock: 1 };
  const zone = (extra) => ({
    seoDefaults: { returnWindowDays: 7 },
    shippingZones: [{ name: "Inside Dhaka", fee: 70, ...extra }],
  });
  const offers = (settings) => buildProduct({ product, settings, siteUrl: SITE }).jsonLd.find((b) => b["@type"] === "Product").offers;

  it("emits deliveryTime when the merchant recorded all four day fields", () => {
    const d = offers(zone({ handlingDaysMin: 0, handlingDaysMax: 1, transitDaysMin: 1, transitDaysMax: 1 })).shippingDetails[0].deliveryTime;
    expect(d["@type"]).toBe("ShippingDeliveryTime");
    expect(d.handlingTime).toMatchObject({ minValue: 0, maxValue: 1, unitCode: "DAY" });
    expect(d.transitTime).toMatchObject({ minValue: 1, maxValue: 1, unitCode: "DAY" });
  });

  it("omits deliveryTime entirely rather than guessing a partial estimate", () => {
    // Prose `eta` is not a substitute — a zone with only some numbers, or none,
    // must emit no deliveryTime at all.
    expect(offers(zone({ eta: "24-48 hours" })).shippingDetails[0].deliveryTime).toBeUndefined();
    expect(offers(zone({ handlingDaysMin: 0, transitDaysMin: 1 })).shippingDetails[0].deliveryTime).toBeUndefined();
  });

  it("emits hasMerchantReturnPolicy from the recorded window, and omits it when unset", () => {
    expect(offers(zone({})).hasMerchantReturnPolicy).toMatchObject({ merchantReturnDays: 7, applicableCountry: "BD" });
    expect(offers({ shippingZones: [{ name: "Z", fee: 0 }] }).hasMerchantReturnPolicy).toBeUndefined();
  });

  it("always states returnMethod — an online-only store can only take returns by courier", () => {
    expect(offers(zone({})).hasMerchantReturnPolicy.returnMethod).toBe("https://schema.org/ReturnByMail");
  });

  it("emits returnFees only once the merchant has recorded who pays", () => {
    // The published refund policy is silent on change-of-mind return postage,
    // so this stays absent until it's set rather than being guessed either way.
    expect(offers(zone({})).hasMerchantReturnPolicy.returnFees).toBeUndefined();

    const paid = buildProduct({
      product,
      settings: { seoDefaults: { returnWindowDays: 7, returnFees: "FreeReturn" }, shippingZones: [] },
      siteUrl: SITE,
    }).jsonLd.find((b) => b["@type"] === "Product").offers;
    expect(paid.hasMerchantReturnPolicy.returnFees).toBe("https://schema.org/FreeReturn");
  });
});

describe("shopCanonicalPath", () => {
  it("sends a single-facet view to its collection landing page", () => {
    expect(shopCanonicalPath({ brand: "mini-gt" })).toBe("/brand/mini-gt");
    expect(shopCanonicalPath({ category: "multi-packs" })).toBe("/category/multi-packs");
  });

  it("keeps every other combination on /shop", () => {
    expect(shopCanonicalPath({})).toBe("/shop");
    expect(shopCanonicalPath({ brand: "mini-gt", category: "multi-packs" })).toBe("/shop");
    expect(shopCanonicalPath({ brand: "mini-gt", q: "rx7" })).toBe("/shop");
    expect(shopCanonicalPath({ brand: "mini-gt", inStock: true })).toBe("/shop");
    expect(shopCanonicalPath({ q: "rx7" })).toBe("/shop");
  });

  it("ignores sort, which is not a content facet", () => {
    expect(shopCanonicalPath({ brand: "mini-gt", sort: "price-asc" })).toBe("/brand/mini-gt");
  });
});

describe("buildCollection", () => {
  const collection = { name: "MINI GT", logo: { url: "https://cdn/logo.png" } };

  it("uses curated copy unsuffixed, and counts the full result set", () => {
    const m = buildCollection({
      kind: "brand",
      slug: "mini-gt",
      collection,
      products: [{ slug: "a", title: "A" }],
      total: 42,
      settings,
      siteUrl: SITE,
    });
    expect(m.title).toBe("MINI GT in Bangladesh — Price & Authentic 1:64 Scale Models");
    expect(m.canonical).toBe(`${SITE}/brand/mini-gt`);
    const list = m.jsonLd.find((b) => b["@type"] === "CollectionPage").mainEntity;
    expect(list.numberOfItems).toBe(42);
    expect(list.itemListElement).toHaveLength(1);
  });

  it("falls back to the collection's own name for an uncurated slug", () => {
    const m = buildCollection({
      kind: "category",
      slug: "new-thing",
      collection: { name: "New Thing" },
      products: [],
      total: 0,
      settings,
      siteUrl: SITE,
    });
    expect(m.title).toBe("New Thing in Bangladesh");
    expect(m.description).toContain("New Thing");
  });
});

describe("buildCmsPage", () => {
  it("suffixes with an em-dash, not the ' | ' template", () => {
    const m = buildCmsPage({ slug: "privacy-policy", page: { title: "Privacy Policy" }, settings, siteUrl: SITE });
    expect(m.title).toBe("Privacy Policy — DiecastBD");
    expect(m.canonical).toBe(`${SITE}/privacy-policy`);
  });

  it("falls back to the merchant default description when the page sets none", () => {
    const m = buildCmsPage({ slug: "x", page: { title: "X", seo: { description: "" } }, settings, siteUrl: SITE });
    expect(m.description).toBe("Merchant default description");
  });
});

describe("settings defaults", () => {
  it("uses the merchant's SEO defaults for the home page", () => {
    const m = buildHome({ settings, siteUrl: SITE });
    expect(m.title).toBe("Merchant default title");
    expect(m.canonical).toBe(`${SITE}/`);
    expect(m.jsonLd.map((b) => b["@type"])).toEqual(["OnlineStore", "WebSite"]);
  });

  it("falls back to shipped copy on a fresh install", () => {
    const m = buildHome({ settings: undefined, siteUrl: SITE });
    expect(m.title).toBe(FALLBACK_TITLE);
    expect(m.description).toBe(FALLBACK_DESCRIPTION);
  });

  it("templates the shop and static pages", () => {
    expect(buildShop({ settings, siteUrl: SITE }).title).toBe(
      "Shop Hot Wheels & MINI GT Diecast Cars in Bangladesh | DiecastBD"
    );
    expect(buildStaticPage({ key: "about", settings, siteUrl: SITE }).title).toBe("About | DiecastBD");
  });
});

describe("buildFaqJsonLd", () => {
  it("emits nothing when the merchant has published no real Q&As", () => {
    expect(buildFaqJsonLd({ settings: {} })).toBeNull();
    expect(buildFaqJsonLd({ settings: { faqs: [{ question: "q" }] } })).toBeNull();
  });

  it("emits only complete pairs", () => {
    const ld = buildFaqJsonLd({
      settings: { faqs: [{ question: "q", answer: "a" }, { question: "half" }] },
    });
    expect(ld.mainEntity).toHaveLength(1);
  });
});
