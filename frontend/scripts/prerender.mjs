// Post-build static prerender for every indexable route.
//
// WHY this exists: the storefront is a client-rendered SPA, so without this
// step EVERY url — /, /shop, /about, every product — is served the same
// index.html: one generic <title>, one generic description, and no
// <link rel="canonical"> at all. That is what Search Console reports as
// "Alternate page with proper canonical tag": to the crawl that happens before
// JS renders, ~50 URLs look like the same page. This bakes a real <head> per
// route into the build output so crawlers see what the page actually is.
//
// WHY NO BROWSER: this used to drive Playwright against `vite preview`. That
// silently stopped working in production and nobody noticed for months (see
// "loud failure" below), because a Chromium launch failure escaped a
// `try/finally` that had no `catch`. Everything that actually matters here is
// head-level, and a head is a string — so we fetch the API with plain Node and
// splice tags in. No Chromium download, no CORS workaround, no preview server,
// ~8 seconds instead of ~3 minutes, and failures are ordinary HTTP errors.
//
// WHICH BODIES GET BAKED, and why not all of them: heads alone left every page
// serving an empty <div id="root">, so the site had ZERO crawlable <a href>
// anywhere — Search Console duly reported "Referring page: None detected" on
// products and parked the whole catalogue in "Discovered - currently not
// indexed". So the pages that must rank now bake bodies too: /collections (the
// link hub), /brand/* and /category/* (the landing pages), /products/* (which
// needed both content AND inbound links), and /:slug CMS guides — a guide IS
// its text, so an empty body there is the worst case of all. /shop is skipped — its content
// is filter-state dependent — and the home page is skipped because the LCP
// work below (hero preload + inlined settings) is a measured optimization worth
// more than body text there.
//
// Baked prices/stock freeze at build time; React replaces them on first paint
// and Google renders JS, so the baked figures only ever serve the pre-render
// pass. Note baked BODIES are not tagged data-prerendered (unlike head tags):
// createRoot REPLACES #root's children rather than hydrating, so untagged
// content survives until React paints and cannot duplicate. See main.jsx and
// lib/seo/collectionsIndex.js.
//
// Serving on Vercel: a real dist/<route>/index.html is served BEFORE the SPA
// rewrite (filesystem beats rewrites — verified in production against
// /robots.txt). The neutral shell for every non-prerendered route is preserved
// as dist/app.html, which vercel.json's catch-all points at, so /cart and
// friends keep a neutral head rather than the home page's.

import { existsSync, readFileSync } from "node:fs";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { injectHead, injectRoot } from "../src/lib/seo/injectHead.js";
import { paramsKey } from "../src/lib/paramsKey.js";
import { HOME_PRODUCT_QUERIES } from "../src/features/home/homeQueries.js";
import { cloudinaryHero, cloudinaryHeroSrcSet, HERO_SIZES } from "../src/lib/cloudinary.js";
import {
  buildCollectionsIndex,
  renderCollectionBody,
  renderCollectionsIndexBody,
  renderCmsPageBody,
  renderProductBody,
} from "../src/lib/seo/collectionsIndex.js";
import { collectionCopy } from "../src/lib/seo/collectionCopy.js";
import {
  buildCmsPage,
  buildCollection,
  buildHome,
  buildProduct,
  buildShop,
  buildStaticPage,
} from "../src/lib/seo/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");

/** VITE_* values as the BUNDLE sees them.
 *
 * Vite loads .env; plain Node does not. Reading only process.env meant
 * VITE_SITE_URL was undefined during local builds, so PROD_ORIGIN silently fell
 * back to the production domain while the bundle had localhost baked in — which
 * is how a `localhost:5173` canonical once ended up in dist/index.html. Real env
 * vars (Vercel dashboard) still win over the file.
 */
function viteEnv(key, fallback = "") {
  if (process.env[key]) return process.env[key];
  try {
    const file = readFileSync(path.resolve(__dirname, "../.env"), "utf8");
    const line = file.split("\n").find((l) => l.trim().startsWith(`${key}=`));
    if (line) return line.slice(line.indexOf("=") + 1).trim();
  } catch {
    /* no .env (CI) — fall through */
  }
  return fallback;
}

// The absolute origin baked into canonical/og:url/JSON-LD. Must match production.
const PROD_ORIGIN = viteEnv("VITE_SITE_URL", "https://diecastbd.com").replace(/\/$/, "");
const API_BASE = viteEnv("VITE_API_BASE_URL").replace(/\/$/, "");

// Fail the build rather than ship a site with no per-route metadata. Set on
// Vercel Production + Preview; off locally so `npm run build` still works with
// the API unreachable.
const STRICT = process.env.PRERENDER_STRICT === "1";
const MIN_ROUTES = Number(process.env.PRERENDER_MIN_ROUTES || 20);

// Routes we always attempt, even if the sitemap is unreachable — so an API
// blip degrades coverage instead of silently emptying it.
const STATIC_FLOOR = ["/", "/shop", "/collections", "/about", "/contact", "/faq"];

// A CMS page whose slug collides with a real route would be written over that
// route's directory. The router matches the real route first, so the file could
// never be reached anyway — refuse rather than corrupt the build output.
const RESERVED_SLUGS = new Set([
  "shop", "products", "brand", "category", "collections", "cart", "checkout",
  "order-confirmation", "about", "contact", "faq", "login", "register",
  "forgot-password", "account", "wishlist", "orders", "admin", "unauthorized",
  "assets", "index.html", "app.html",
]);

const log = (msg) => console.log(`[prerender] ${msg}`);
const warn = (msg) => console.error(`[prerender] ${msg}`);

const errors = [];
function fail(msg) {
  errors.push(msg);
  warn(`FAILED ${msg}`);
}

// Routes actually written, and — when we deliberately didn't prerender at all —
// why. Module scope so the report is written on EVERY exit path, including the
// early-outs: verify-prerender.mjs runs next in the build chain and needs to be
// able to tell "skipped on purpose" (a local build) from "silently produced
// nothing" (the failure mode this whole rewrite exists to make loud).
const baked = [];
let skipped = null;

async function writeReport() {
  await writeFile(
    path.join(DIST, "prerender-report.json"),
    JSON.stringify(
      { ok: errors.length === 0, skipped, origin: PROD_ORIGIN, count: baked.length, routes: baked, errors },
      null,
      2
    ),
    "utf8"
  );
}

/* ------------------------------------------------------------- API access -- */

/** GET an endpoint and return the full `{ success, data, meta }` envelope, or
 * null once the failure has been recorded. */
async function apiEnvelope(pathname) {
  try {
    const res = await fetch(`${API_BASE}${pathname}`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    fail(`GET ${pathname} — ${err.message}`);
    return null;
  }
}

/** Just the `data` payload — the common case. */
async function api(pathname) {
  return (await apiEnvelope(pathname))?.data ?? null;
}

/** The whole catalogue. The list payload already carries everything a product
 * head needs (seo, description, thumbnail, gallery, price, salePrice,
 * availableStock, sku, modelNumber, brand) — no per-product fetch required. */
/** Fields a product card provably cannot render, dropped from the baked
 * homepage payload — `description` alone is a sixth of a product's JSON.
 *
 * Deliberately a DENYLIST, not an allowlist of card fields. ProductCard
 * destructures nine fields but also hands the whole product to WishlistButton,
 * useAddToCart and the pricing helpers, so an allowlist that missed one would
 * break the card for the moment before the live refetch replaces it — a bug
 * that only appears in the first second of a cold load and would be miserable
 * to find. Everything here is prose, SEO or bookkeeping that no card path
 * touches; when in doubt a field stays, since the cost is only bytes.
 */
const NON_CARD_FIELDS = [
  "description",
  "features",
  "specifications",
  "seo",
  "tags",
  "createdAt",
  "updatedAt",
  "isDeleted",
  "__v",
];

function trimForCard(product) {
  const out = { ...product };
  for (const field of NON_CARD_FIELDS) delete out[field];
  return out;
}

async function fetchAllProducts() {
  const first = await apiEnvelope("/products?limit=100&page=1");
  if (!first) return [];
  const all = first.data ?? [];
  const totalPages = first.meta?.totalPages ?? 1;
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await apiEnvelope(`/products?limit=100&page=${page}`);
    all.push(...(next?.data ?? []));
  }
  return all;
}

/** Every indexable URL, straight from the sitemap the backend already computes
 * from Mongo (active products, published pages, active brands/categories).
 * Reading it here means the prerendered set and the sitemap cannot drift, and
 * works around there being no public "list pages" endpoint. */
async function discoverRoutes() {
  const paths = new Set(STATIC_FLOOR);
  try {
    const res = await fetch(`${API_BASE.replace(/\/api\/v1$/, "")}/sitemap.xml`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const p = m[1].replace(/^https?:\/\/[^/]+/, "") || "/";
      paths.add(p);
    }
  } catch (err) {
    fail(`sitemap discovery — ${err.message}`);
  }
  return [...paths];
}

/** Run `worker` over `items` with bounded concurrency. */
async function pool(items, limit, worker) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await worker(items[idx], idx);
      }
    })
  );
  return results;
}

/* ------------------------------------------------------------ head models -- */

/** Resolve one route path to { model, body }, or null to leave it CSR.
 * `model` is the head; `body` (usually null) is raw HTML for the routes whose
 * BODY is baked too — the /collections hub and the brand/category landing
 * pages, i.e. the pages whose raw-HTML links and copy are the ranking surface. */
async function modelFor(route, ctx) {
  const { settings, productsBySlug, products, brands, categories, guides } = ctx;
  const siteUrl = PROD_ORIGIN;

  if (route === "/") return buildHome({ settings, siteUrl });
  if (route === "/shop") return buildShop({ settings, siteUrl, filters: {} });
  if (route === "/collections") {
    return {
      model: buildCollectionsIndex({ settings, siteUrl }),
      // The hub's whole job is putting real <a href> links into raw HTML — the
      // sitemap is otherwise the only signal our URLs exist.
      body: renderCollectionsIndexBody({ brands, categories, products, pages: guides }),
    };
  }

  const staticKey = { "/about": "about", "/contact": "contact", "/faq": "faq" }[route];
  if (staticKey) return buildStaticPage({ key: staticKey, settings, siteUrl });

  const product = route.match(/^\/products\/([^/]+)$/);
  if (product) {
    const doc = productsBySlug.get(product[1]);
    if (!doc) {
      fail(`product ${product[1]} is in the sitemap but not in /products`);
      return null;
    }
    // Body baked too: URL Inspection showed products with "Referring page:
    // None detected" and an empty <div id="root"> — no content AND no inbound
    // links. The body gives them both.
    return {
      model: buildProduct({ product: doc, settings, siteUrl }),
      body: renderProductBody({ product: doc }),
    };
  }

  const collection = route.match(/^\/(brand|category)\/([^/]+)$/);
  if (collection) {
    const [, kind, slug] = collection;
    const doc = (kind === "brand" ? brands : categories).find((c) => c.slug === slug);
    if (!doc) {
      fail(`${kind} ${slug} is in the sitemap but not in /${kind}s`);
      return null;
    }
    // Same query the page itself runs, so the baked ItemList matches the grid.
    const envelope = await apiEnvelope(`/products?${kind}=${encodeURIComponent(slug)}&limit=24&page=1`);
    const products = envelope?.data ?? [];
    const total = envelope?.meta?.total ?? products.length;
    const model = buildCollection({ kind, slug, collection: doc, products, total, settings, siteUrl });
    // Landing pages bake their body too: H1 + product links + merchant content
    // + FAQ text. Before this, their raw HTML had no H1 and zero anchors.
    const body = renderCollectionBody({ copy: collectionCopy(slug, doc), collection: doc, products, total });
    return { model, body };
  }

  const cms = route.match(/^\/([^/]+)$/);
  if (cms) {
    const slug = cms[1];
    if (RESERVED_SLUGS.has(slug)) {
      fail(`CMS slug "${slug}" collides with a real route — rename it in Admin → Pages`);
      return null;
    }
    const page = await api(`/pages/${encodeURIComponent(slug)}`);
    if (!page) return null; // api() already recorded the failure
    // Guides are pure text — an empty body here is the worst case of all.
    return { model: buildCmsPage({ slug, page, settings, siteUrl }), body: renderCmsPageBody({ page }) };
  }

  warn(`no builder for ${route} — leaving it CSR`);
  return null;
}

/* -------------------------------------------------------------------- run -- */

async function main() {
  if (!existsSync(path.join(DIST, "index.html"))) {
    fail("dist/index.html not found — did `vite build` run?");
    return;
  }

  // CRITICAL: dist/app.html is the neutral SPA shell that vercel.json's catch-all
  // rewrite serves for EVERY non-prerendered route (cart, checkout, account, …).
  // It must exist whenever index.html does — otherwise those routes 404. Create
  // it FIRST, unconditionally, before any early-out below. Only the home
  // snapshot later overwrites dist/index.html; app.html always stays neutral.
  const SHELL = readFileSync(path.join(DIST, "index.html"), "utf8");
  await copyFile(path.join(DIST, "index.html"), path.join(DIST, "app.html"));

  if (process.env.PRERENDER === "false") {
    skipped = "PRERENDER=false";
    log("PRERENDER=false — neutral app.html written, routes stay CSR.");
    return;
  }
  if (/localhost|127\.0\.0\.1/.test(PROD_ORIGIN)) {
    skipped = `VITE_SITE_URL is local ("${PROD_ORIGIN}")`;
    log(`⚠ VITE_SITE_URL looks local ("${PROD_ORIGIN}"). Set it to the production origin so baked canonicals are correct. Skipping prerender (app.html written, routes stay CSR).`);
    return;
  }
  if (!API_BASE) {
    fail("VITE_API_BASE_URL is not set — cannot fetch the content to bake.");
    return;
  }

  log(`origin ${PROD_ORIGIN} · api ${API_BASE}${STRICT ? " · STRICT" : ""}`);

  const [settings, products, brands, categories, guides, routes] = await Promise.all([
    api("/settings"),
    fetchAllProducts(),
    api("/brands"),
    api("/categories"),
    // Published guides for the /collections hub. Plain fetch, NOT apiEnvelope:
    // a failure here must not hit fail() (which is fatal under STRICT) — an
    // older backend deploy without GET /pages just means the hub omits its
    // Guides section, which is not worth blocking a deploy over.
    fetch(`${API_BASE}/pages`, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.data ?? [])
      .catch(() => []),
    discoverRoutes(),
  ]);

  const productsBySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  const ctx = {
    settings,
    products: products ?? [],
    productsBySlug,
    brands: brands ?? [],
    categories: categories ?? [],
    guides: guides ?? [],
  };

  log(`discovered ${routes.length} routes · ${productsBySlug.size} products`);

  // Everything the homepage needs on first paint, fetched from the SAME
  // endpoints the browser would call. Settings alone left the carousels showing
  // skeletons while their own round trips completed; this puts the card text
  // and prices in the HTML so they paint with the shell and only images stream.
  //
  // Deliberately re-queries the API per homepage query rather than filtering
  // the already-fetched `products` list: "featured"/"newArrival"/"hero" and the
  // sort order are the server's definitions, and re-implementing them here
  // would drift the first time one changed. A failed query is simply omitted —
  // that carousel falls back to today's runtime fetch rather than baking junk.
  const homeData = { products: {}, brands: brands ?? undefined, categories: categories ?? undefined };
  await Promise.all(
    Object.values(HOME_PRODUCT_QUERIES).map(async (params) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ).toString();
      // Plain fetch rather than apiEnvelope(), which calls fail() on any error
      // — and fail() is fatal under PRERENDER_STRICT. These three queries are a
      // speed optimization; losing one must degrade to a runtime fetch, never
      // take the deploy down. (A build-time 429 from the rate limiter is a very
      // real way for that to happen — it happened while developing this.)
      const envelope = await fetch(`${API_BASE}/products?${qs}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (envelope?.data) {
        homeData.products[paramsKey(params)] = { ...envelope, data: envelope.data.map(trimForCard) };
      }
    })
  );
  const bakedQueries = Object.keys(homeData.products).length;
  const wantedQueries = Object.keys(HOME_PRODUCT_QUERIES).length;
  log(`home payload: ${bakedQueries}/${wantedQueries} product queries · ${homeData.brands?.length ?? 0} brands · ${homeData.categories?.length ?? 0} categories`);
  // warn(), NOT fail(): fail() is fatal under PRERENDER_STRICT, which is on for
  // Production and Preview. A query that didn't bake costs that carousel a
  // round trip — exactly the behaviour before this optimization existed — and
  // no deploy should be blocked over a page loading the way it used to. Same
  // reasoning as the guides fetch above. Missing route METADATA still fails,
  // because that damage is invisible and lasting; this is just slower.
  if (bakedQueries < wantedQueries) {
    warn(`only ${bakedQueries} of ${wantedQueries} homepage product queries baked — those carousels fall back to loading at runtime.`);
  }

  await pool(routes, 6, async (route) => {
    try {
      const resolved = await modelFor(route, ctx);
      if (!resolved) return;
      // Branches return either a bare head model or { model, body } for the
      // routes whose body is baked too. Head models never carry a `model` key,
      // so this normalization is unambiguous.
      const model = resolved.model ?? resolved;
      const body = resolved.body ?? null;

      // Home only: inline the settings the app needs on first paint, and start
      // the hero image download during HTML parse. The preload matters most —
      // the hero <img> is the LCP element and, rendered only after the settings
      // round trip, its request otherwise can't begin until JS has booted.
      let extra = "";
      if (route === "/" && settings) {
        const heroUrl = settings.homepageSections?.hero?.image?.url;
        extra = [
          // The preload MUST describe the same candidates as the <img> in
          // HeroSection, or the browser downloads one image for the preload and
          // a different one for the element. It did exactly that: the raw
          // Cloudinary URL was preloaded at 335 KB while the <img> requested a
          // 19 KB `f_auto,q_auto` variant — a wasted third of a megabyte, about
          // 1.7s of fast-3G bandwidth, stolen from the render it was meant to
          // accelerate. imagesrcset/imagesizes mirror the element's srcSet and
          // sizes so the preload resolves to the identical candidate.
          heroUrl
            ? `<link rel="preload" as="image" fetchpriority="high" imagesrcset="${cloudinaryHeroSrcSet(heroUrl).replace(/"/g, "&quot;")}" imagesizes="${HERO_SIZES}" href="${cloudinaryHero(heroUrl).replace(/"/g, "&quot;")}">`
            : "",
          `<script type="application/json" id="__SETTINGS__">${JSON.stringify(settings).replace(/</g, "\\u003c")}</script>`,
          homeData ? `<script type="application/json" id="__HOME_DATA__">${JSON.stringify(homeData).replace(/</g, "\\u003c")}</script>` : "",
        ]
          .filter(Boolean)
          .join("\n    ");
      }

      let html = injectHead(SHELL, model, extra);
      if (body) html = injectRoot(html, body);

      const outPath = route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route.replace(/^\//, ""), "index.html");
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html, "utf8");
      baked.push({ route, title: model.title, canonical: model.canonical, file: path.relative(DIST, outPath) });
    } catch (err) {
      fail(`${route} — ${err.message}`);
    }
  });

  baked.sort((a, b) => a.route.localeCompare(b.route));
  log(`prerendered ${baked.length}/${routes.length} routes.`);
  if (baked.length < MIN_ROUTES) fail(`only ${baked.length} routes baked, expected at least ${MIN_ROUTES}`);
}

main()
  .catch((err) => fail(`unexpected error — ${err.message}`))
  .finally(async () => {
    // Written on every path, including the deliberate skips — see writeReport.
    await writeReport().catch((err) => warn(`could not write report — ${err.message}`));

    // A deliberate skip is a valid local build, but in production it means the
    // site would ship with no per-route metadata at all — the exact failure this
    // rewrite exists to prevent — so strict mode treats it as fatal.
    if (skipped && STRICT) {
      warn(`PRERENDER_STRICT=1 and prerendering was skipped (${skipped}) — failing the build.`);
      process.exitCode = 1;
      return;
    }
    if (errors.length === 0) return;

    warn(`${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);
    // In strict mode a bad prerender must stop the deploy. Vercel keeps the
    // CURRENT production deployment serving when a build fails, so the blast
    // radius is "the deploy doesn't ship", never "the site breaks".
    if (STRICT) {
      warn("PRERENDER_STRICT=1 — failing the build.");
      process.exitCode = 1;
    } else {
      warn("not strict — leaving the build as-is; affected routes stay CSR.");
    }
  });
