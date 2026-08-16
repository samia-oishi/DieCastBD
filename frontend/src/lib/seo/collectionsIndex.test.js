import { describe, expect, it } from "vitest";

import { injectRoot } from "./injectHead";
import { COLLECTIONS_TITLE, buildCollectionsIndex, renderCollectionsIndexBody } from "./collectionsIndex";

const SITE = "https://diecastbd.com";

const count = (html, re) => (html.match(re) ?? []).length;

describe("buildCollectionsIndex", () => {
  it("self-canonicalises and templates the title", () => {
    const m = buildCollectionsIndex({ settings: undefined, siteUrl: SITE });
    expect(m.title).toBe(`${COLLECTIONS_TITLE} | DiecastBD`);
    expect(m.canonical).toBe(`${SITE}/collections`);
    expect(m.jsonLd[0]["@type"]).toBe("BreadcrumbList");
  });
});

describe("renderCollectionsIndexBody", () => {
  const data = {
    brands: [{ slug: "mini-gt", name: "MINI GT" }],
    categories: [
      { slug: "multi-packs", name: "Multi-Packs" },
      { slug: "accessories", name: "Accessories" },
    ],
    products: [
      { slug: "a-car", title: "A Car" },
      { slug: "b-car", title: "B Car" },
      { slug: "c-car", title: "C Car" },
    ],
    pages: [{ slug: "buying-guide", title: "Buying Guide" }],
  };

  it("emits one anchor per catalogue record", () => {
    const body = renderCollectionsIndexBody(data);
    expect(count(body, /href="\/products\//g)).toBe(3);
    expect(count(body, /href="\/brand\//g)).toBe(1);
    expect(count(body, /href="\/category\//g)).toBe(2);
    expect(count(body, /href="\/buying-guide"/g)).toBe(1);
    expect(count(body, /<h1>/g)).toBe(1);
  });

  it("omits empty sections rather than rendering hollow headings", () => {
    const body = renderCollectionsIndexBody({ brands: [], categories: [], products: [], pages: [] });
    expect(body).not.toContain("<h2>Brands</h2>");
    expect(body).not.toContain("<h2>Guides</h2>");
    expect(count(body, /<h1>/g)).toBe(1);
  });

  it("escapes merchant-controlled titles", () => {
    const body = renderCollectionsIndexBody({
      ...data,
      products: [{ slug: "x", title: '<script>alert(1)</script> & "quoted"' }],
    });
    expect(body).not.toContain("<script>alert(1)");
    expect(body).toContain("&lt;script&gt;");
  });

  it("is never tagged data-prerendered — main.jsx must not strip it", () => {
    expect(renderCollectionsIndexBody(data)).not.toContain("data-prerendered");
  });
});

describe("injectRoot", () => {
  const SHELL = '<html><head></head><body><div id="root"></div></body></html>';

  it("plants the body inside the mount point", () => {
    const out = injectRoot(SHELL, "<main><h1>Hi</h1></main>");
    expect(out).toContain('<div id="root"><main><h1>Hi</h1></main></div>');
  });

  it("throws when the mount point is missing or already filled", () => {
    expect(() => injectRoot("<html><body></body></html>", "x")).toThrow(/no empty/);
    expect(() => injectRoot('<div id="root"><p>already</p></div>', "x")).toThrow(/no empty/);
  });
});
