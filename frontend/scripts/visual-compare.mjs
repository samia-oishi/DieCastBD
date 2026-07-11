// Visual-compare harness for the storefront redesign QA gates.
//
// Captures full-page screenshots of a built route and its .dc.html design
// reference at 390px (mobile) and 1440px (desktop), plus a 320px overflow
// assertion, into frontend/qa/<phase>/. Used at every phase stop so the built
// page and the reference can be viewed side by side.
//
// Usage:
//   node scripts/visual-compare.mjs --phase <name> --route </path> --ref "<file.dc.html>"
//   node scripts/visual-compare.mjs --phase phase4-home --route / --ref "DiecastBD Landing Final.dc.html"
//
// Assumes the frontend dev server is running on http://localhost:5173.

import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const HANDOFF_DIR = path.join(REPO_ROOT, "design_handoff_diecastbd_storefront");
const BASE_URL = process.env.APP_URL || "http://localhost:5173";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const phase = arg("phase", "adhoc");
const route = arg("route", "/");
const refFile = arg("ref", null);

const outDir = path.join(__dirname, "..", "qa", phase);
fs.mkdirSync(outDir, { recursive: true });

const WIDTHS = [
  { label: "390", width: 390, height: 844 }, // mobile — verified first
  { label: "1440", width: 1440, height: 900 }, // desktop
];

async function shoot(page, url, width, height, outPath) {
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(600); // settle fonts / lazy images
  await page.screenshot({ path: outPath, fullPage: true });
}

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 2 });
const page = await context.newPage();

// Built route — mobile pair first
for (const { label, width, height } of WIDTHS) {
  const out = path.join(outDir, `built-${label}.png`);
  await shoot(page, `${BASE_URL}${route}`, width, height, out);
  console.log(`built  ${label}px -> ${path.relative(REPO_ROOT, out)}`);
}

// Design reference (file:// with encoded spaces)
if (refFile) {
  const refUrl = pathToFileURL(path.join(HANDOFF_DIR, refFile)).href;
  for (const { label, width, height } of WIDTHS) {
    const out = path.join(outDir, `ref-${label}.png`);
    await shoot(page, refUrl, width, height, out);
    console.log(`ref    ${label}px -> ${path.relative(REPO_ROOT, out)}`);
  }
}

// 320px overflow check on the built route
await page.setViewportSize({ width: 320, height: 780 });
await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(400);
const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
const overflow = scrollW > 320;
if (overflow) {
  const out = path.join(outDir, "overflow-320.png");
  await page.screenshot({ path: out, fullPage: true });
  console.log(`OVERFLOW at 320px: scrollWidth=${scrollW} (>320) -> ${path.relative(REPO_ROOT, out)}`);
} else {
  console.log(`320px OK: scrollWidth=${scrollW} (<=320)`);
}

await browser.close();
console.log(`\nDone. Screenshots in ${path.relative(REPO_ROOT, outDir)}/`);
process.exit(overflow ? 1 : 0);
