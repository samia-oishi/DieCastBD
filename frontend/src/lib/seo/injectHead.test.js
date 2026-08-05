import { describe, expect, it } from "vitest";

import { buildHeadTags, escapeAttr, injectHead, serializeJsonLd, tagKey } from "./injectHead";

// A miniature of the real dist shell: static fallback SEO tags (including the
// multi-line formatting Vite preserves) plus tags that must survive untouched.
const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>DiecastBD — Premium Diecast Collectibles</title>
    <meta
      name="description"
      content="Generic fallback description."
    />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DiecastBD" />
    <meta property="og:title" content="DiecastBD — Premium Diecast Collectibles" />
    <meta property="og:image" content="https://diecastbd.com/share-image" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="google-site-verification" content="token123" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
  </head>
  <body><div id="root"></div></body>
</html>`;

const count = (html, re) => (html.match(re) ?? []).length;

describe("tagKey", () => {
  it("keys meta by name and property, and only canonical links", () => {
    expect(tagKey('<meta name="description" content="x">')).toBe("meta:name:description");
    expect(tagKey('<meta property="og:title" content="x">')).toBe("meta:prop:og:title");
    expect(tagKey('<link rel="canonical" href="x">')).toBe("link:canonical");
    expect(tagKey('<link rel="manifest" href="x">')).toBeNull();
    expect(tagKey('<meta charset="UTF-8">')).toBeNull();
  });
});

describe("injectHead", () => {
  const model = {
    title: "Mazda RX-7 — Buy in Bangladesh | DiecastBD",
    description: "Buy the Mazda RX-7 in Bangladesh at DiecastBD.",
    canonical: "https://diecastbd.com/products/mazda-rx-7",
    ogUrl: "https://diecastbd.com/products/mazda-rx-7",
    ogType: "product",
    image: "https://res.cloudinary.com/x/rx7.jpg",
    jsonLd: [{ "@type": "Product", name: "Mazda RX-7" }],
  };

  it("leaves exactly one title, description and canonical", () => {
    const out = injectHead(SHELL, model);
    expect(count(out, /<title\b/gi)).toBe(1);
    expect(count(out, /name="description"/gi)).toBe(1);
    expect(count(out, /rel="canonical"/gi)).toBe(1);
    expect(count(out, /property="og:title"/gi)).toBe(1);
    expect(count(out, /property="og:type"/gi)).toBe(1);
  });

  it("replaces the generic values with the route's own", () => {
    const out = injectHead(SHELL, model);
    expect(out).toContain("<title data-prerendered=\"1\">Mazda RX-7 — Buy in Bangladesh | DiecastBD</title>");
    expect(out).not.toContain("Generic fallback description.");
    expect(out).not.toContain("DiecastBD — Premium Diecast Collectibles");
    expect(out).toContain('content="product"');
  });

  it("preserves tags it does not own", () => {
    const out = injectHead(SHELL, model);
    expect(out).toContain('<meta charset="UTF-8" />');
    expect(out).toContain('name="google-site-verification"');
    expect(out).toContain('property="og:site_name"');
    expect(out).toContain('name="twitter:card"');
    expect(out).toContain('rel="manifest"');
    expect(out).toContain('src="/assets/index-abc.js"');
    expect(out).toContain('<div id="root">');
  });

  it("keeps the static share image when the route has none of its own", () => {
    const out = injectHead(SHELL, { ...model, image: undefined });
    expect(out).toContain("https://diecastbd.com/share-image");
    expect(count(out, /property="og:image"/gi)).toBe(1);
  });

  it("marks every injected tag so main.jsx can strip them on boot", () => {
    const out = injectHead(SHELL, model);
    const injected = out.match(/data-prerendered="1"/g) ?? [];
    // title, og:title, description, og:description, canonical, og:url,
    // og:type, og:image, twitter:image, one JSON-LD block
    expect(injected).toHaveLength(10);
  });

  it("appends extra head HTML when given", () => {
    const out = injectHead(SHELL, model, '<script id="__SETTINGS__">{}</script>');
    expect(out).toContain('<script id="__SETTINGS__">{}</script>');
  });

  it("throws rather than emit a shell it could not parse", () => {
    expect(() => injectHead("<html><body>no head</body></html>", model)).toThrow(/no <head>/);
  });
});

describe("escaping", () => {
  it("neutralises quotes and angle brackets in attribute values", () => {
    expect(escapeAttr('a "b" <c> & \'d\'')).toBe("a &quot;b&quot; &lt;c&gt; &amp; &#39;d&#39;");
  });

  it("keeps a merchant-supplied title from breaking out of its tag", () => {
    // Product and CMS titles are merchant-controlled, so they reach the shell
    // as untrusted input. <title> is RCDATA — only `<` can end it — and
    // attribute values additionally need their quotes neutralised.
    const out = injectHead(SHELL, {
      title: '</title><script>alert(1)</script> and " a quote',
      description: "d",
      canonical: "https://diecastbd.com/x",
    });
    expect(out).not.toContain("<script>alert(1)");
    expect(out).toContain("&lt;/title&gt;&lt;script&gt;");
    expect(count(out, /<title\b/gi)).toBe(1);
    // …and the same value inside og:title's attribute has its quote escaped.
    expect(out).toMatch(/property="og:title" content="[^"]*&quot; a quote"/);
  });

  it("keeps </script> inside JSON-LD from closing the tag early", () => {
    const json = serializeJsonLd({ description: "</script><img onerror=x>" });
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c/script>");
  });
});

describe("buildHeadTags", () => {
  it("omits optional tags rather than emitting empty ones", () => {
    const tags = buildHeadTags({ title: "T" });
    const keys = tags.map((t) => t.key);
    expect(keys).toContain("title");
    expect(keys).not.toContain("link:canonical");
    expect(keys).not.toContain("meta:name:description");
    expect(keys).not.toContain("meta:prop:og:image");
  });

  it("gives JSON-LD no key, so it never replaces an existing tag", () => {
    const tags = buildHeadTags({ title: "T", jsonLd: [{ a: 1 }, { b: 2 }] });
    expect(tags.filter((t) => t.key === null)).toHaveLength(2);
  });
});
