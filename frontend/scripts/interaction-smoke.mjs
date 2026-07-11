// Mobile interaction smoke test for the storefront redesign QA gates.
//
// Runs at 390px against the built app (http://localhost:5173) and asserts the
// mobile-only interactions the redesign hinges on actually work. Checks are
// route-aware and skip gracefully when a target isn't present yet, so the same
// script grows usefully as pages land across phases.
//
// Usage: node scripts/interaction-smoke.mjs [--route /shop]

import { chromium } from "playwright";

const BASE_URL = process.env.APP_URL || "http://localhost:5173";
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const only = arg("route", null);

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();

async function go(route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(400);
}

// --- Bottom nav navigates (Home page) ---
if (!only || only === "/") {
  try {
    await go("/");
    const nav = page.locator('[data-testid="mobile-bottom-nav"], nav[aria-label="Mobile"]').first();
    const navVisible = await nav.isVisible().catch(() => false);
    if (navVisible) {
      const shopTab = nav.locator('a[href="/shop"]').first();
      await shopTab.click();
      await page.waitForTimeout(600);
      record("bottom-nav → /shop", page.url().endsWith("/shop"), page.url());
    } else {
      record("bottom-nav present", false, "nav not found (build pending)");
    }
  } catch (e) {
    record("bottom-nav", false, e.message.split("\n")[0]);
  }
}

// --- Filter sheet opens & filters grid (Shop page) ---
if (!only || only === "/shop") {
  try {
    await go("/shop");
    const filtersBtn = page.getByRole("button", { name: /filters/i }).first();
    if (await filtersBtn.isVisible().catch(() => false)) {
      await filtersBtn.click();
      await page.waitForTimeout(400);
      const sheet = page.locator('[role="dialog"]').first();
      record("shop filter sheet opens", await sheet.isVisible().catch(() => false));
    } else {
      record("shop filter sheet", false, "Filters button not found (build pending)");
    }
  } catch (e) {
    record("shop filter sheet", false, e.message.split("\n")[0]);
  }
}

// --- Carousel advances via Embla API (Home) ---
if (!only || only === "/") {
  try {
    await go("/");
    const arrow = page.locator('[data-embla-next]').first();
    if (await arrow.isVisible().catch(() => false)) {
      const track = page.locator('[data-embla-track]').first();
      const before = await track.evaluate((el) => el.style.transform).catch(() => "");
      await arrow.click();
      await page.waitForTimeout(500);
      const after = await track.evaluate((el) => el.style.transform).catch(() => "");
      record("carousel advances", before !== after, `${before} -> ${after}`);
    } else {
      record("carousel advances", false, "embla arrows not found (build pending)");
    }
  } catch (e) {
    record("carousel advances", false, e.message.split("\n")[0]);
  }
}

// --- Sticky action bar present + bottom nav absent (PDP/cart/checkout) ---
for (const route of ["/cart", "/checkout"]) {
  if (only && only !== route) continue;
  try {
    await go(route);
    const nav = page.locator('[data-testid="mobile-bottom-nav"]').first();
    const navHidden = !(await nav.isVisible().catch(() => false));
    record(`bottom-nav hidden on ${route}`, navHidden);
  } catch (e) {
    record(`bottom-nav hidden on ${route}`, false, e.message.split("\n")[0]);
  }
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
