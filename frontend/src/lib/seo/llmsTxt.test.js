import { describe, it, expect } from "vitest";
import { renderLlmsTxt } from "./llmsTxt";

const base = {
  settings: {
    seoDefaults: { description: "Real merchant description.", returnWindowDays: 7 },
    contactInfo: { email: "shop@example.com", phone: "0156", address: "Dhanmondi, Dhaka" },
    socialLinks: { whatsapp: "https://wa.me/x" },
    bkashConfig: { merchantNumber: "017" },
    shippingZones: [{ name: "Inside Dhaka", fee: 80, eta: "24–48 hours" }],
  },
  brands: [{ slug: "hotwheels", name: "Hot Wheels", activeProductCount: 55 }],
  categories: [],
  products: [{ slug: "car", title: "A Car", price: 900, availableStock: 2 }],
  guides: [],
  siteUrl: "https://diecastbd.com",
};

describe("llms.txt", () => {
  it("states the facts an assistant needs to recommend the shop", () => {
    const out = renderLlmsTxt(base);
    expect(out).toContain("Cash on delivery");
    expect(out).toContain("bKash");
    expect(out).toContain("7 days");
    expect(out).toContain("Inside Dhaka: ৳80 — 24–48 hours");
    expect(out).toContain("https://diecastbd.com/products/car");
  });

  // #11, the house rule: absent data is omitted, never filled in with something
  // plausible. A shop with no return policy must not appear to offer one.
  it("omits what the merchant has not set rather than inventing it", () => {
    const out = renderLlmsTxt({
      ...base,
      settings: { shippingZones: [], contactInfo: {}, socialLinks: {}, seoDefaults: {} },
    });
    expect(out).not.toContain("Returns");
    expect(out).not.toContain("bKash");
    expect(out).not.toContain("Delivery");
    expect(out).not.toContain("undefined");
  });

  // The same drift this file already caused once: a local "is it stocked"
  // filter listed /category/hot-wheels while the edge 301s it away.
  it("never advertises a collection the site redirects away", () => {
    const out = renderLlmsTxt({
      ...base,
      categories: [
        { slug: "hot-wheels", name: "Hot Wheels", activeProductCount: 52 },
        { slug: "mainlines", name: "Mainlines", activeProductCount: 12 },
      ],
    });
    expect(out).not.toContain("/category/hot-wheels");
    expect(out).toContain("/category/mainlines");
  });

  it("marks sold-out products honestly", () => {
    const out = renderLlmsTxt({ ...base, products: [{ slug: "x", title: "X", price: 500, availableStock: 0 }] });
    expect(out).toContain("out of stock");
  });
});
