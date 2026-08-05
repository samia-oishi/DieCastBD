// Proves the baked <head> and the hydrated <head> agree — the check that keeps
// prerendering honest.
//
// Two failure modes this exists to catch:
//
//  1. DUPLICATES. react-helmet-async v3 on React 19 APPENDS its tags; it never
//     removes what's already in <head>. If main.jsx's [data-prerendered] strip
//     ever regresses, every prerendered route ships two <title>s, two canonicals
//     and two Product JSON-LD entities — and Google may discard the canonical
//     signal entirely. Nothing else in the test suite would notice.
//
//  2. CLOAKING. If the baked head and the rendered head ever disagree, the page
//     Google crawls describes itself differently from the page it renders. The
//     shared lib/seo/ modules make that structurally unlikely; this makes it
//     observable.
//
// Not part of `npm run build` — it needs Chromium, and the build must stay
// browser-free. Run it before promoting a deploy:
//
//   npm run build && node scripts/verify-hydration-parity.mjs

import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, statSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");
const PORT = 4184;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

/** Serve dist/ the way Vercel does, because that is what we're verifying:
 * filesystem first (including directory index resolution), and only then the
 * SPA fallback to app.html.
 *
 * `vite preview` is NOT equivalent — its SPA fallback rewrites /faq to
 * index.html, so every route would appear to serve the home page's baked head
 * and the parity check would report drift that doesn't exist in production.
 */
function serveDist() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const direct = path.join(DIST, urlPath);
      let file = null;

      if (existsSync(direct) && statSync(direct).isFile()) file = direct;
      else if (existsSync(path.join(direct, "index.html"))) file = path.join(direct, "index.html");
      else file = path.join(DIST, "app.html"); // the catch-all rewrite

      res.setHeader("Content-Type", MIME[path.extname(file)] ?? "application/octet-stream");
      res.end(readFileSync(file));
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

/** The raw HTML carries escaped entities; the DOM gives decoded text. */
function decodeEntities(value) {
  return value == null
    ? value
    : value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
}

function viteEnv(key, fallback = "") {
  if (process.env[key]) return process.env[key];
  try {
    const file = readFileSync(path.resolve(__dirname, "../.env"), "utf8");
    const line = file.split("\n").find((l) => l.trim().startsWith(`${key}=`));
    if (line) return line.slice(line.indexOf("=") + 1).trim();
  } catch {
    /* no .env (CI) */
  }
  return fallback;
}

const API_BASE = viteEnv("VITE_API_BASE_URL").replace(/\/$/, "");

const ROUTES = process.argv.slice(2).filter((a) => a.startsWith("/"));

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};

/** The three signals that decide how a URL is indexed, plus their counts. */
const READ_HEAD = () => ({
  title: document.title,
  titleCount: document.querySelectorAll("title").length,
  description: document.querySelector('meta[name="description"]')?.content ?? null,
  descriptionCount: document.querySelectorAll('meta[name="description"]').length,
  canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
  canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
  ogTitle: document.querySelector('meta[property="og:title"]')?.content ?? null,
  productLd: [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => {
      try {
        return JSON.parse(s.textContent);
      } catch {
        return null;
      }
    })
    .filter((b) => b?.["@type"] === "Product").length,
  leftovers: document.querySelectorAll("[data-prerendered]").length,
});

async function main() {
  const { chromium } = await import("playwright");

  const report = JSON.parse(readFileSync(path.join(DIST, "prerender-report.json"), "utf8"));
  const routes = ROUTES.length
    ? ROUTES
    : ["/", "/shop", "/faq", "/privacy-policy", report.routes.find((r) => r.route.startsWith("/brand/"))?.route, report.routes.find((r) => r.route.startsWith("/products/"))?.route].filter(Boolean);

  const server = await serveDist();
  const base = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();

    // The preview origin isn't in the API's CORS allowlist, so in-page calls
    // would be discarded by the browser and every page would render its error
    // state. Node's fetch isn't subject to CORS — answer them here. Test-only.
    if (API_BASE) {
      await page.route("**/api/v1/**", async (route) => {
        try {
          const res = await fetch(route.request().url(), { headers: { accept: "application/json" } });
          await route.fulfill({
            status: res.status,
            contentType: res.headers.get("content-type") ?? "application/json",
            body: await res.text(),
          });
        } catch {
          await route.abort();
        }
      });
    }

    for (const route of routes) {
      const expected = report.routes.find((r) => r.route === route);

      // 1. What a JS-blind crawler sees: the raw bytes.
      const raw = await (await fetch(`${base}${route}`)).text();
      const rawTitle = decodeEntities(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null);
      const rawCanonical = decodeEntities(raw.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1] ?? null);

      // 2. What Google's renderer sees: the hydrated DOM.
      await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 20000 });
      await page.waitForFunction(() => document.querySelectorAll("[data-prerendered]").length === 0, null, {
        timeout: 15000,
      });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      const live = await page.evaluate(READ_HEAD);

      const label = route.padEnd(46);
      check(live.titleCount === 1, `${route} — ${live.titleCount} <title> after hydration (expected 1)`);
      check(live.canonicalCount === 1, `${route} — ${live.canonicalCount} canonicals after hydration (expected 1)`);
      check(live.descriptionCount === 1, `${route} — ${live.descriptionCount} descriptions after hydration (expected 1)`);
      check(live.leftovers === 0, `${route} — ${live.leftovers} [data-prerendered] tags survived hydration`);

      // Parity: baked === rendered. This is the anti-cloaking assertion.
      check(rawTitle === live.title, `${route} — title drift\n      baked:    ${rawTitle}\n      rendered: ${live.title}`);
      check(
        rawCanonical === live.canonical,
        `${route} — canonical drift\n      baked:    ${rawCanonical}\n      rendered: ${live.canonical}`
      );
      check(live.ogTitle === live.title, `${route} — og:title (${live.ogTitle}) != <title> (${live.title})`);
      if (expected) check(rawTitle === expected.title, `${route} — baked title differs from prerender-report`);
      if (route.startsWith("/products/")) {
        check(live.productLd === 1, `${route} — ${live.productLd} Product JSON-LD entities after hydration (expected 1)`);
      }

      console.log(`  ${label} ${live.titleCount}×title ${live.canonicalCount}×canonical  ${live.title}`);
    }
  } finally {
    await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }

  if (failures.length) {
    console.error(`\n[hydration-parity] ${failures.length} failure(s):\n  - ${failures.join("\n  - ")}`);
    process.exit(1);
  }
  console.log("\n[hydration-parity] ✓ baked and hydrated heads agree, exactly one of each tag.");
}

main().catch((err) => {
  console.error(`[hydration-parity] ${err.message}`);
  process.exit(1);
});
