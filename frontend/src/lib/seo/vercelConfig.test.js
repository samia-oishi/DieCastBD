import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { REDIRECTED_SLUGS, asLinkableCollections } from "../collectionVisibility";

const config = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../vercel.json"), "utf8")
);

/** Vercel validates vercel.json against a strict schema and REJECTS THE WHOLE
 * DEPLOY on an unknown key — there is no warning and no partial apply. A
 * `"comment"` added to three redirects to explain why they exist failed a
 * production deploy on 2026-09-07. JSON has no comment syntax; the reasoning
 * lives in docs/DEPLOYMENT.md instead, and this test is the tripwire.
 *
 * Every redirect here also protects a URL Google has indexed, so a config that
 * silently fails to deploy strands real ranking — worth a test, not a habit. */
const ALLOWED_REDIRECT_KEYS = new Set(["source", "destination", "permanent", "statusCode", "has", "missing"]);

describe("vercel.json", () => {
  it("uses only keys Vercel's redirect schema accepts", () => {
    for (const r of config.redirects ?? []) {
      const unknown = Object.keys(r).filter((k) => !ALLOWED_REDIRECT_KEYS.has(k));
      expect(unknown, `redirect "${r.source}" has keys Vercel will reject: ${unknown.join(", ")}`).toEqual([]);
    }
  });

  it("keeps the redirects that protect indexed URLs", () => {
    const dests = Object.fromEntries((config.redirects ?? []).map((r) => [r.source + (r.has ? `?${r.has[0].key}=${r.has[0].value}` : ""), r]));
    // Both were indexed by Google before the 2026-09-07 Hot Wheels brand merge.
    for (const src of ["/brand/hot-wheels-premium", "/shop?brand=hot-wheels-premium"]) {
      expect(dests[src], `${src} lost its redirect — that URL is indexed`).toBeTruthy();
      expect(dests[src].destination).toBe("/brand/hotwheels");
      expect(dests[src].permanent, `${src} must be a 301 to pass ranking on`).toBe(true);
    }
  });

  it("keeps the Soft 404 redirects for removed pages", () => {
    // Each of these returned HTTP 200 while rendering "Page not found" — the
    // definition of a Soft 404, which Search Console flagged on 2026-09-21.
    // Removing a redirect here puts that URL straight back into the report.
    const dests = Object.fromEntries((config.redirects ?? []).map((r) => [r.source, r]));
    const gone = [
      "/products/star-race-1-64-porsche-911-gt3-r-roxy-80-pink",
      "/products/star-race-1-64-porsche-911-gt3-r-rexy-77-green",
      "/products/cca-1-64-bmw-m4-gt3-white",
      "/products/cca-1-64-audi-rs5-dtm-black",
      "/brand/star-race",
      "/brand/cca",
      "/demo",
      "/qa-blocks",
    ];
    for (const src of gone) {
      expect(dests[src], `${src} lost its redirect — it becomes a Soft 404 again`).toBeTruthy();
      expect(dests[src].permanent, `${src} must be a 301`).toBe(true);
    }
  });

  // The opposite failure, and the one that put these here: a redirect that
  // OUTLIVED its reason. `/brand/generic` and `/category/mainlines` were
  // redirected on 2026-09-21 because a deactivated collection had no page; now
  // it does (plan.md #109), and both still hold live products, so the sitemap
  // listed them while the edge redirected them away. A redirect must not
  // shadow a collection the sitemap advertises.
  it("does not redirect a collection that still has live products", () => {
    const sources = new Set((config.redirects ?? []).map((r) => r.source));
    for (const src of ["/brand/generic", "/category/mainlines"]) {
      expect(sources.has(src), `${src} is live and in the sitemap — it must not redirect`).toBe(false);
    }
  });

  // The hub must not hand crawlers a link the edge immediately redirects. Most
  // redirected collections are excluded for free because they have no products
  // left; `REDIRECTED_SLUGS` is for the one that still does (`hot-wheels`: 52 of
  // the 55 products on /brand/hotwheels, merged 2026-09-07).
  //
  // Only the stale-entry direction is checkable here — "is an entry still
  // backed by a real redirect" is static, while "does a redirected collection
  // still have products" depends on live data. A stale entry is the dangerous
  // one: it silently hides a page that has started serving content again.
  it("keeps REDIRECTED_SLUGS backed by an actual redirect", () => {
    const sources = new Set((config.redirects ?? []).map((r) => r.source));
    for (const slug of REDIRECTED_SLUGS) {
      const hasRedirect = sources.has(`/category/${slug}`) || sources.has(`/brand/${slug}`);
      expect(hasRedirect, `"${slug}" is hidden from the hub and sitemap but nothing redirects it — it is just missing`).toBe(true);
    }
  });

  it("hides a redirected collection from the hub even when it still has products", () => {
    const linked = asLinkableCollections([
      { slug: "hot-wheels", activeProductCount: 52 },
      { slug: "mainlines", activeProductCount: 12 },
    ]).map((c) => c.slug);
    expect(linked).toEqual(["mainlines"]);
  });

  it("still serves the SPA fallback and the sitemap proxy", () => {
    const sources = (config.rewrites ?? []).map((r) => r.source);
    expect(sources).toContain("/sitemap.xml");
    expect(sources).toContain("/(.*)");
  });
});
