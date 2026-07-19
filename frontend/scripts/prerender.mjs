// Post-build static prerender for the stable marketing routes.
//
// WHY this exists: the storefront is a client-rendered SPA. Google renders JS
// so it sees our per-page <title>/description/canonical/JSON-LD fine, but
// JS-blind crawlers (Facebook/WhatsApp/LinkedIn) only ever saw the generic
// index.html. This step bakes the fully-rendered HTML for the marketing routes
// into the build output so those crawlers get real per-route metadata + copy.
//
// WHY only these routes: product/shop pages are driven by MongoDB at runtime —
// prerendering them would freeze prices/stock at build time. They stay CSR (and
// already emit dynamic client-side meta + Product JSON-LD). See docs/plan.md.
//
// HOW it stays safe: this is a pure enhancement that DEGRADES TO TODAY'S
// BEHAVIOUR. Any failure (no Chromium, API down, a route that renders an error
// state) is caught — that route simply keeps falling back to the SPA shell, and
// the build still exits 0. It can never break a deploy.
//
// Serving on Vercel: a real dist/<route>/index.html is served before the SPA
// rewrite (filesystem beats rewrites). The neutral SPA shell for every dynamic
// route is preserved as dist/app.html — vercel.json's catch-all points there so
// product pages keep a neutral head, never the home page's.

import { existsSync } from "node:fs";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");
const PORT = 4183;

// The absolute origin baked into canonical/og:url/JSON-LD. Must match production.
// If VITE_SITE_URL was set at build time the app already emits it; this is also
// used to scrub the local preview origin out of the snapshot as a safety net.
const PROD_ORIGIN = (process.env.VITE_SITE_URL || "https://diecastbd.com").replace(/\/$/, "");

// The stable, indexable marketing routes. Product/shop/account/etc. are
// intentionally excluded — they're dynamic or private.
// "/" is processed LAST: writing its snapshot overwrites dist/index.html (also
// the SPA-fallback shell the other routes render against during the crawl), so
// we keep that shell neutral until every other route is captured.
const ROUTES = [
  "/about",
  "/contact",
  "/faq",
  "/terms-conditions",
  "/privacy-policy",
  "/refund-policy",
  "/shipping-policy",
  "/",
];

function log(msg) {
  console.log(`[prerender] ${msg}`);
}

async function main() {
  if (!existsSync(path.join(DIST, "index.html"))) {
    log("dist/index.html not found — did `vite build` run? Skipping.");
    return;
  }

  // CRITICAL: dist/app.html is the neutral SPA shell that vercel.json's catch-all
  // rewrite serves for EVERY dynamic route (products, shop, account, …). It must
  // exist whenever index.html does — otherwise those routes 404. So create it
  // FIRST, unconditionally, before any skip path below. (This is just a copy of
  // the freshly-built neutral index.html; it can't fail and needs no Chromium.)
  // Only the prerender step later overwrites dist/index.html with the home
  // snapshot — app.html always stays the neutral shell.
  await copyFile(path.join(DIST, "index.html"), path.join(DIST, "app.html"));

  if (process.env.PRERENDER === "false") {
    log("PRERENDER=false — neutral app.html written, routes stay CSR.");
    return;
  }
  if (/localhost|127\.0\.0\.1/.test(PROD_ORIGIN)) {
    log(`⚠ VITE_SITE_URL looks local ("${PROD_ORIGIN}"). Set it to the production origin (e.g. https://diecastbd.com) so baked canonicals are correct. Skipping prerender (app.html written, routes stay CSR).`);
    return;
  }

  // Lazy-import the heavy deps so a machine without them (or without Chromium)
  // fails softly instead of crashing the build.
  let preview, chromium;
  try {
    ({ preview } = await import("vite"));
    ({ chromium } = await import("playwright"));
  } catch (err) {
    log(`prerender deps unavailable (${err.message}) — app.html written, routes stay CSR.`);
    return;
  }

  let server, browser;
  try {
    server = await preview({
      root: path.resolve(__dirname, ".."),
      preview: { port: PORT, strictPort: true, host: "127.0.0.1" },
    });
    const base = `http://127.0.0.1:${PORT}`;

    browser = await chromium.launch();
    const page = await browser.newPage();

    let done = 0;
    for (const route of ROUTES) {
      const url = `${base}${route}`;
      try {
        await page.goto(url, { waitUntil: "load", timeout: 20000 });
        // Wait until react-helmet-async has injected a <link rel="canonical">
        // whose path equals THIS route. This is both the "React has rendered"
        // signal and the correctness guard in one: the served SPA shell may
        // carry a stale baked canonical, so merely-exists isn't enough — we wait
        // for the value to actually match. A route that renders an error/empty
        // state (e.g. a CMS page with the API down) never matches and is skipped,
        // so we never bake a junk snapshot — it just stays CSR.
        await page.waitForFunction(
          (expected) => {
            const el = document.querySelector('link[rel="canonical"]');
            if (!el) return false;
            const p = (el.getAttribute("href") || "").replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "") || "/";
            return p === expected;
          },
          route,
          { timeout: 15000 }
        );
        // Small settle for late JSON-LD / async section content.
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

        // De-dupe the <head>: index.html ships static fallback SEO tags for
        // JS-blind crawlers, and react-helmet-async ADDS per-route tags rather
        // than replacing them — leaving a snapshot with two <title>s / two
        // og:titles, and a crawler may read the generic static one first. The
        // static tags always sit in the authored <head>; helmet appends its
        // per-route tags AFTER them, so "keep the last of each key" keeps the
        // per-route value. Single-occurrence static tags (og:image, twitter:card,
        // GSC token, og:type) have no per-route equivalent and are left as-is.
        await page.evaluate(() => {
          const head = document.head;
          // <title>: document.title is the authoritative per-route value (helmet
          // keeps it in sync). The helmet/static title elements don't order
          // predictably, so collapse to a single element carrying document.title.
          const desiredTitle = document.title;
          head.querySelectorAll("title").forEach((t) => t.remove());
          const titleEl = document.createElement("title");
          titleEl.textContent = desiredTitle;
          head.appendChild(titleEl);

          // meta + canonical: helmet appends its per-route tag AFTER the static
          // fallback, so keep the last of each key; single-occurrence static tags
          // (og:image, twitter:card, GSC token, og:type) have no per-route
          // equivalent and survive untouched.
          const keyOf = (el) => {
            if (el.tagName === "META" && el.getAttribute("name")) return "meta:name:" + el.getAttribute("name");
            if (el.tagName === "META" && el.getAttribute("property")) return "meta:prop:" + el.getAttribute("property");
            if (el.tagName === "LINK" && el.getAttribute("rel") === "canonical") return "link:canonical";
            return null;
          };
          const groups = {};
          for (const el of head.querySelectorAll("meta[name], meta[property], link[rel='canonical']")) {
            const k = keyOf(el);
            if (k) (groups[k] ||= []).push(el);
          }
          for (const list of Object.values(groups)) list.slice(0, -1).forEach((el) => el.remove());
        });

        // Scrub any local preview origin that leaked in via window.location
        // fallback (belt-and-suspenders — with VITE_SITE_URL set there is none).
        let html = "<!doctype html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));
        html = html.split(base).join(PROD_ORIGIN);

        const outPath =
          route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route.replace(/^\//, ""), "index.html");
        await mkdir(path.dirname(outPath), { recursive: true });
        await writeFile(outPath, html, "utf8");
        done += 1;
        log(`✓ ${route} → ${path.relative(DIST, outPath)}`);
      } catch (err) {
        log(`skip ${route} — ${err.message.split("\n")[0]}`);
      }
    }
    log(`prerendered ${done}/${ROUTES.length} routes.`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise((r) => server.httpServer.close(r));
  }
}

// Never let prerender failure fail the build — it's an enhancement that
// gracefully degrades to the (already working) CSR behaviour.
main()
  .catch((err) => log(`unexpected error, leaving build as-is: ${err.message}`))
  .finally(() => process.exit(0));
