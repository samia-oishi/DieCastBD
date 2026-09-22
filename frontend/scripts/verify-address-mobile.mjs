/** Drives the REAL checkout address field on a phone-sized browser.
 *
 * WHY a browser and not jsdom: the combined area search (plan.md #110) put 721
 * options behind one field, and everything that can go wrong with that is
 * layout and volume — a panel wider than the screen, a list that takes a second
 * to open, a label colliding with its district. jsdom has no layout, so it
 * cannot see any of it.
 *
 * Seeds a guest cart in localStorage so /checkout renders without a login,
 * using a real in-stock product from the live API.
 *
 *   npx vite preview --port 4173
 *   node scripts/verify-address-mobile.mjs
 */
import { chromium, devices } from "playwright";

const API = process.env.VITE_API_BASE_URL ?? "https://api.diecastbd.com/api/v1";
const ORIGIN = process.env.ORIGIN ?? "http://localhost:4173";

/** Opening must feel instant on a mid-range phone, and the DOM must stay small
 * enough that it does. These are the numbers the change is held to. */
const MAX_OPEN_MS = 1200;
const MAX_OPTIONS_IN_DOM = 120;

const problems = [];
const check = (ok, msg) => {
  console.log(`  ${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) problems.push(msg);
};

const envelope = await fetch(`${API}/products?limit=1&inStock=true`).then((r) => r.json());
const product = envelope?.data?.[0];
if (!product) {
  console.error("No in-stock product to seed a cart with — cannot reach /checkout.");
  process.exit(1);
}

const browser = await chromium.launch();
let failed = false;

// Desktop is in the list on purpose. The panel used to float and, when short
// of room below, flip ABOVE the trigger — measured against the window, which is
// the wrong box inside a modal, so it opened upwards across unrelated fields.
// It is in flow everywhere now, and "opens below its field" is asserted.
const VIEWPORTS = [
  { name: "iPhone SE", ctx: devices["iPhone SE"] },
  { name: "iPhone 13", ctx: devices["iPhone 13"] },
  { name: "Pixel 7", ctx: devices["Pixel 7"] },
  { name: "Desktop", ctx: { viewport: { width: 1440, height: 900 } } },
];

for (const { name: deviceName, ctx: deviceCtx } of VIEWPORTS) {
  const ctx = await browser.newContext({ ...deviceCtx });
  await ctx.addInitScript(
    (c) => localStorage.setItem("diecastbd-guest-cart", JSON.stringify(c)),
    { state: { items: [{ product, qty: 1 }] }, version: 0 }
  );
  const page = await ctx.newPage();
  const width = page.viewportSize().width;
  console.log(`\n${deviceName} (${width}px)`);

  await page.goto(`${ORIGIN}/checkout`, { waitUntil: "domcontentloaded" });
  await page.getByText("Area (thana, district)", { exact: false }).first().waitFor({ timeout: 20000 });

  const trigger = page.locator("[aria-haspopup='listbox']").first();
  await trigger.scrollIntoViewIfNeeded();

  const t0 = Date.now();
  await trigger.click();
  const search = page.getByPlaceholder(/Search thana or district/i);
  await search.waitFor({ timeout: 10000 });
  const openMs = Date.now() - t0;

  const options = await page.getByRole("option").count();
  check(openMs <= MAX_OPEN_MS, `opens in ${openMs}ms (budget ${MAX_OPEN_MS}ms)`);
  check(options <= MAX_OPTIONS_IN_DOM, `${options} options in the DOM (budget ${MAX_OPTIONS_IN_DOM})`);

  // The panel must fit the screen, and the page must not gain sideways scroll.
  const box = await page.getByRole("listbox").boundingBox();
  check(box.x >= -1 && box.x + box.width <= width + 1, `panel fits the screen (x=${Math.round(box.x)} w=${Math.round(box.width)})`);
  const doc = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  check(doc.s <= doc.c + 1, `no horizontal page scroll (${doc.s} <= ${doc.c})`);

  // The panel opens IN FLOW on a phone, so it can land under the docked order
  // bar — measured at 42px before the fix, which is a whole row, and the bar
  // swallows the tap so that option is simply unreachable.
  await page.waitForTimeout(700); // the scroll-into-view is smooth
  const listBox = await page.getByRole("listbox").boundingBox();
  const orderBtn = await page.getByRole("button", { name: /place order/i }).first().boundingBox();
  const overlap =
    Math.min(listBox.y + listBox.height, orderBtn.y + orderBtn.height) - Math.max(listBox.y, orderBtn.y);
  check(overlap <= 0, `list is clear of the docked order bar (${overlap > 0 ? Math.round(overlap) + "px covered" : "no overlap"})`);

  // The complaint that prompted this: the panel appearing above its own field,
  // over content it has nothing to do with.
  const trigBox = await trigger.boundingBox();
  check(
    listBox.y >= trigBox.y,
    `panel opens below its field (field at ${Math.round(trigBox.y)}, panel at ${Math.round(listBox.y)})`
  );

  // The widest row in the whole list must not overflow its own panel.
  await search.fill("Rajbari Office");
  await page.getByRole("option").first().waitFor({ timeout: 5000 });
  const row = await page.evaluate(() => {
    const li = document.querySelector("[role='option']");
    return { scrollW: li.scrollWidth, clientW: li.clientWidth, text: li.innerText.replace(/\n/g, " ") };
  });
  check(row.scrollW <= row.clientW + 1, `widest row fits: "${row.text}" (${row.scrollW} <= ${row.clientW})`);

  // And it still has to work: searching a thana selects its district too.
  await search.fill("Dhanmondi");
  await page.getByRole("option", { name: /Dhanmondi/ }).first().click();
  const label = (await trigger.innerText()).trim();
  check(/Dhanmondi/.test(label), `selecting by thana sets the field ("${label}")`);

  // Tap targets: a row a thumb can actually hit (WCAG 2.5.8 asks for 24px).
  await trigger.click();
  await search.fill("Dhaka");
  const h = await page.evaluate(() => document.querySelector("[role='option']").getBoundingClientRect().height);
  check(h >= 24, `row height ${Math.round(h)}px is tappable`);

  await page.screenshot({ path: `/tmp/address-${deviceName.replace(/\s+/g, "-")}.png` });
  await ctx.close();
  if (problems.length) failed = true;
  problems.length = 0;
}

await browser.close();
console.log(failed ? "\n[address-mobile] FAILED\n" : "\n[address-mobile] ✓ all viewports pass\n");
process.exit(failed ? 1 : 0);
