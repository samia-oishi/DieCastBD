// Phase 1 admin-regression check: confirm the storefront :root resolves to the
// light paper tokens AND the [data-theme="diecastbd-admin"] scope resolves to the
// exact pre-redesign dark values. Admin is behind Firebase auth, so comparing
// computed custom-property values is more reliable than authed screenshots.

import { chromium } from "playwright";

const BASE_URL = process.env.APP_URL || "http://localhost:5173";

// Original pre-redesign dark values that the admin scope MUST restore byte-for-byte.
const ADMIN_EXPECTED = {
  "--background": "#0a0a0a",
  "--foreground": "#fafafa",
  "--card": "#141414",
  "--primary": "#a3e635",
  "--primary-foreground": "#0a0a0a",
  "--secondary": "#1f1f1f",
  "--muted": "#1a1a1a",
  "--muted-foreground": "#a1a1aa",
  "--accent": "#1f1f1f",
  "--destructive": "#ef4444",
  "--ring": "#a3e635",
  "--chart-1": "#a3e635",
  "--chart-2": "#84cc16",
  "--chart-3": "#65a30d",
  "--chart-4": "#4d7c0f",
  "--chart-5": "#3f6212",
  "--radius": "0.5rem",
  "--sidebar": "#0d0d0d",
  "--sidebar-primary": "#a3e635",
  "--sidebar-accent": "#1a1a1a",
};

const ROOT_EXPECTED_LIGHT = {
  "--background": "#FAFAF7",
  "--foreground": "#101208",
  "--primary": "#A8CD2F",
  "--ring": "#A8CD2F",
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE_URL, { waitUntil: "networkidle" });

const { rootVals, adminVals, rootFont, adminFont } = await page.evaluate(() => {
  const read = (el, names) => {
    const cs = getComputedStyle(el);
    const o = {};
    for (const n of names) o[n] = cs.getPropertyValue(n).trim();
    return o;
  };
  const names = [
    "--background", "--foreground", "--card", "--primary", "--primary-foreground",
    "--secondary", "--muted", "--muted-foreground", "--accent", "--destructive",
    "--ring", "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5",
    "--radius", "--sidebar", "--sidebar-primary", "--sidebar-accent",
  ];
  const probe = document.createElement("div");
  probe.setAttribute("data-theme", "diecastbd-admin");
  document.body.appendChild(probe);
  return {
    rootVals: read(document.documentElement, names),
    adminVals: read(probe, names),
    rootFont: getComputedStyle(document.documentElement).getPropertyValue("--display-font").trim(),
    adminFont: getComputedStyle(probe).getPropertyValue("--display-font").trim(),
  };
});

await browser.close();

const norm = (v) => v.toLowerCase().replace(/\s+/g, " ").trim();
let fail = 0;

console.log("=== Admin scope must equal original dark values ===");
for (const [k, want] of Object.entries(ADMIN_EXPECTED)) {
  const got = adminVals[k];
  const ok = norm(got) === norm(want);
  if (!ok) fail++;
  console.log(`${ok ? "OK " : "XX "} ${k}: got '${got}' want '${want}'`);
}

console.log("\n=== Storefront :root must be light paper values ===");
for (const [k, want] of Object.entries(ROOT_EXPECTED_LIGHT)) {
  const got = rootVals[k];
  const ok = norm(got) === norm(want);
  if (!ok) fail++;
  console.log(`${ok ? "OK " : "XX "} ${k}: got '${got}' want '${want}'`);
}

console.log("\n=== Fonts ===");
console.log(`storefront --display-font: '${rootFont}' (expect Archivo)`);
console.log(`admin      --display-font: '${adminFont}' (expect Geist)`);
if (!/archivo/i.test(rootFont)) fail++;
if (!/geist/i.test(adminFont)) fail++;

console.log(`\n${fail === 0 ? "PASS — theme split verified" : `FAIL — ${fail} mismatches`}`);
process.exit(fail === 0 ? 0 : 1);
