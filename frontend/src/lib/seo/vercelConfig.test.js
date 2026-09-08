import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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

  it("still serves the SPA fallback and the sitemap proxy", () => {
    const sources = (config.rewrites ?? []).map((r) => r.source);
    expect(sources).toContain("/sitemap.xml");
    expect(sources).toContain("/(.*)");
  });
});
