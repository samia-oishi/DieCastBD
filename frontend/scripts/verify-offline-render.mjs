// Renders prerendered pages in Chromium with EVERY api.diecastbd.com call
// blocked, and asserts each still shows its real content — never the
// "Couldn't load this page" error screen.
//
// WHY: Google indexes the RENDERED page, and its renderer routinely fails to
// load some resources (URL Inspection showed "3/30 couldn't be loaded"). When
// those failures were the API calls, React wiped the baked body and painted
// PageLoadError — so Search Console classified fully-written guides as
// "Soft 404" and refused to index them (plan.md #92). This script simulates
// that worst case exactly: if these assertions pass, a total API outage inside
// Google's renderer still leaves a fully readable page.
//
// Needs Chromium (like verify-hydration-parity.mjs) — run before promoting:
//   npm run build && npm run verify:offline

import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, statSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");
const PORT = 4186;

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

// Serve dist/ the way Vercel does: filesystem first, then the SPA fallback.
function serveDist() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const direct = path.join(DIST, urlPath);
      let file = null;
      if (existsSync(direct) && statSync(direct).isFile()) file = direct;
      else if (existsSync(path.join(direct, "index.html"))) file = path.join(direct, "index.html");
      else file = path.join(DIST, "app.html");
      res.setHeader("Content-Type", MIME[path.extname(file)] ?? "application/octet-stream");
      res.end(readFileSync(file));
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};

async function main() {
  const { chromium } = await import("playwright");
  const report = JSON.parse(readFileSync(path.join(DIST, "prerender-report.json"), "utf8"));

  // One of each baked page type. Guides/products/collections are the pages the
  // Soft-404 verdicts hit; home and a policy page round out the coverage.
  const routes = [
    "/",
    "/collections",
    report.routes.find((r) => r.route.startsWith("/products/"))?.route,
    report.routes.find((r) => r.route.startsWith("/brand/"))?.route,
    report.routes.find((r) => r.route.startsWith("/category/"))?.route,
    "/privacy-policy",
    report.routes.find((r) => /how-to-spot|premium-vs-mainline|price-in-bangladesh|storing-diecast/.test(r.route))?.route,
  ].filter(Boolean);

  const server = await serveDist();
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    // The Google's-renderer-worst-case: every API call fails.
    await page.route("**/api/v1/**", (route) => route.abort());

    for (const route of routes) {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      const r = await page.evaluate(() => ({
        text: document.body.innerText,
        h1: document.querySelector("h1")?.textContent ?? null,
        title: document.title,
      }));
      const words = r.text.split(/\s+/).filter(Boolean).length;

      check(!r.text.includes("Couldn't load this page"), `${route} — renders the PageLoadError screen with the API down`);
      check(!r.text.includes("Page not found"), `${route} — renders the 404 screen with the API down`);
      check(r.h1, `${route} — no <h1> in the rendered DOM with the API down`);
      check(words >= 50, `${route} — only ${words} rendered words with the API down`);
      console.log(`  ${route.padEnd(50)} ${String(words).padStart(4)}w  h1: ${(r.h1 ?? "NONE").slice(0, 40)}`);
    }
  } finally {
    await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }

  if (failures.length) {
    console.error(`\n[offline-render] ${failures.length} failure(s):\n  - ${failures.join("\n  - ")}`);
    process.exit(1);
  }
  console.log("\n[offline-render] ✓ every page type renders real content with the API completely unreachable.");
}

main().catch((err) => {
  console.error(`[offline-render] ${err.message}`);
  process.exit(1);
});
