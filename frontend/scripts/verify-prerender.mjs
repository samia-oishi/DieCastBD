// Asserts that the prerender actually produced per-route metadata.
//
// WHY: the previous prerender failed silently in production for months. Every
// URL served one identical 4067-byte shell with the same generic <title> and no
// canonical, and the build stayed green the whole time. A build step whose
// failure is invisible is a build step you don't have. This is the check that
// makes the failure loud.
//
//   node scripts/verify-prerender.mjs                      # local, reads dist/
//   node scripts/verify-prerender.mjs --base=https://…     # post-deploy smoke test
//
// Exits non-zero on any failure, so it can gate a build or a deploy.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");

const baseArg = process.argv.find((a) => a.startsWith("--base="));
const BASE = baseArg ? baseArg.slice("--base=".length).replace(/\/$/, "") : null;

// The title index.html ships. Any route still showing this has not been baked.
const GENERIC_TITLE = "DiecastBD — Premium Diecast Collectibles";

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
  return ok;
};

const countOf = (html, re) => (html.match(re) ?? []).length;
const titleOf = (html) => html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
const canonicalOf = (html) =>
  html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1] ??
  html.match(/<link[^>]*href="([^"]*)"[^>]*rel="canonical"/i)?.[1] ??
  null;

async function loadRoute(route) {
  if (BASE) {
    const res = await fetch(`${BASE}${route}`);
    return { html: await res.text(), status: res.status };
  }
  const file = route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route.replace(/^\//, ""), "index.html");
  if (!existsSync(file)) return { html: null, status: 404 };
  return { html: readFileSync(file, "utf8"), status: 200 };
}

function verifyRoute(route, html, expected) {
  const label = `${route}`;
  if (!check(html, `${label} — no HTML (route not baked?)`)) return;

  const title = titleOf(html);
  check(countOf(html, /<title[\s>]/gi) === 1, `${label} — expected exactly 1 <title>, got ${countOf(html, /<title[\s>]/gi)}`);
  check(title && title !== GENERIC_TITLE, `${label} — still shows the generic shell title (${title})`);
  check(
    countOf(html, /rel="canonical"/gi) === 1,
    `${label} — expected exactly 1 canonical, got ${countOf(html, /rel="canonical"/gi)}`
  );
  check(
    countOf(html, /name="description"/gi) === 1,
    `${label} — expected exactly 1 description, got ${countOf(html, /name="description"/gi)}`
  );

  const canonical = canonicalOf(html);
  if (expected?.canonical) {
    check(canonical === expected.canonical, `${label} — canonical is ${canonical}, expected ${expected.canonical}`);
  } else {
    check(Boolean(canonical), `${label} — no canonical`);
  }

  if (expected?.productJsonLd) {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        failures.push(`${label} — unparseable JSON-LD`);
        return null;
      }
    });
    const product = blocks.find((b) => b?.["@type"] === "Product");
    if (check(product, `${label} — no Product JSON-LD`)) {
      check(product.offers?.price != null, `${label} — Product JSON-LD has no offers.price`);
      check(Boolean(product.offers?.availability), `${label} — Product JSON-LD has no offers.availability`);
    }
    // Exactly one Product entity: two would mean main.jsx's [data-prerendered]
    // strip regressed and helmet's copy is coexisting with the baked one.
    check(
      blocks.filter((b) => b?.["@type"] === "Product").length === 1,
      `${label} — expected exactly 1 Product JSON-LD entity`
    );
  }
}

async function main() {
  const where = BASE ?? "dist/";
  console.log(`[verify-prerender] checking ${where}`);

  // The report tells us what the prerender believes it produced; verifying
  // against it catches "the script skipped a route and didn't say so".
  let report = null;
  if (BASE) {
    report = await fetch(`${BASE}/prerender-report.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  } else if (existsSync(path.join(DIST, "prerender-report.json"))) {
    report = JSON.parse(readFileSync(path.join(DIST, "prerender-report.json"), "utf8"));
  }

  if (!check(report, "no prerender-report.json — the prerender did not run")) {
    console.error(`\n[verify-prerender] ${failures.length} failure(s):\n  - ${failures.join("\n  - ")}`);
    process.exit(1);
  }

  // The prerender skips on purpose for a local build (VITE_SITE_URL pointing at
  // localhost, or PRERENDER=false) so a laptop can't bake localhost canonicals
  // into dist/. That's a valid build with nothing to verify — failing here would
  // break `npm run build` for every developer. In production it's the opposite:
  // a skip means shipping a site with no per-route metadata, so prerender.mjs
  // has already failed the build under PRERENDER_STRICT before we get here.
  if (report.skipped) {
    console.log(`[verify-prerender] prerendering was skipped (${report.skipped}) — nothing to verify.`);
    console.log("[verify-prerender] routes will be client-rendered, as they are in dev.");
    return;
  }

  check(report.ok, `prerender reported ${report.errors?.length ?? 0} error(s): ${(report.errors ?? []).join("; ")}`);

  // Every route the prerender claims to have baked must actually verify.
  for (const entry of report.routes ?? []) {
    const { html } = await loadRoute(entry.route);
    verifyRoute(entry.route, html, {
      canonical: entry.canonical,
      productJsonLd: entry.route.startsWith("/products/"),
    });
  }

  // /collections exists to put real product links into raw HTML — the fix for
  // the whole catalogue sitting in "Discovered – currently not indexed" with
  // zero internal links. A hub page that silently baked without its links
  // would look green while removing the feature's entire point, so count them.
  {
    const productRoutes = (report.routes ?? []).filter((r) => r.route.startsWith("/products/")).length;
    const { html } = await loadRoute("/collections");
    if (check(html, "/collections — not baked")) {
      const anchors = countOf(html, /href="\/products\//g);
      check(
        anchors >= productRoutes,
        `/collections — only ${anchors} product links in raw HTML, expected ≥ ${productRoutes}`
      );
      check(countOf(html, /href="\/brand\//g) >= 1, "/collections — no brand links in raw HTML");
    }
  }

  // Product pages must carry a real body: an H1 and outbound links. Google's
  // URL Inspection reported "Referring page: None detected" on every product —
  // orphaned pages with empty bodies is exactly what leaves 32 URLs sitting in
  // "Discovered – currently not indexed".
  {
    const sample = (report.routes ?? []).find((r) => r.route.startsWith("/products/"));
    if (sample) {
      const { html } = await loadRoute(sample.route);
      if (check(html, `${sample.route} — not baked`)) {
        check(countOf(html, /<h1[\s>]/g) === 1, `${sample.route} — expected exactly 1 <h1> in the baked body`);
        check(
          countOf(html, /<a href="\//g) >= 3,
          `${sample.route} — expected at least 3 internal links (breadcrumb + brand + hub)`
        );
      }
    }
  }

  // Titles must be distinct — identical titles across URLs is the exact defect
  // that put this site in Search Console's "Alternate page" bucket.
  const titles = new Map();
  for (const entry of report.routes ?? []) {
    if (titles.has(entry.title)) failures.push(`duplicate <title> on ${entry.route} and ${titles.get(entry.title)}`);
    else titles.set(entry.title, entry.route);
  }

  // The neutral SPA shell must stay neutral — it is served for every route that
  // ISN'T prerendered, so a canonical baked into it would be wrong everywhere.
  if (!BASE) {
    const appHtml = existsSync(path.join(DIST, "app.html")) ? readFileSync(path.join(DIST, "app.html"), "utf8") : null;
    if (check(appHtml, "dist/app.html is missing — the SPA fallback would 404")) {
      check(countOf(appHtml, /rel="canonical"/gi) === 0, "dist/app.html must not carry a canonical");
      check(titleOf(appHtml) === GENERIC_TITLE, "dist/app.html must keep the neutral title");
      check(!appHtml.includes("data-prerendered"), "dist/app.html must not contain prerendered tags");
    }
    const indexHtml = readFileSync(path.join(DIST, "index.html"), "utf8");
    check(indexHtml !== appHtml, "dist/index.html is identical to app.html — the home page was not baked");
  }

  if (failures.length) {
    console.error(`\n[verify-prerender] ${failures.length} failure(s):\n  - ${failures.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(`[verify-prerender] ✓ ${report.routes?.length ?? 0} routes verified, all with distinct titles and canonicals.`);
}

main().catch((err) => {
  console.error(`[verify-prerender] ${err.message}`);
  process.exit(1);
});
