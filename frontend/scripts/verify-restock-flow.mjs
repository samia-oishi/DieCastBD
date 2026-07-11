// Verify the restock notify flow end-to-end at 390px: open the sheet on a
// sold-out card, submit a real disposable contact, confirm the success step,
// and re-capture the sheet (z-index fix). The created alert is cleaned up by
// the caller (script prints the contact used).
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const OUT = path.join(process.cwd(), "qa", "phase3-primitives");
fs.mkdirSync(OUT, { recursive: true });
const CONTACT = "01711000999"; // disposable BD phone for this test

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
await page.goto("http://localhost:5173/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.getByRole("button", { name: /notify me/i }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(OUT, "restock-390-fixed.png") });
console.log("captured restock-390-fixed.png (z-index check)");

await page.getByPlaceholder(/01XXXXXXXXX/i).fill(CONTACT);
await page.getByRole("button", { name: /set my alert/i }).click();
await page.waitForTimeout(1500);

const success = await page.getByText("You're on the list.").isVisible().catch(() => false);
await page.screenshot({ path: path.join(OUT, "restock-390-success.png") });
console.log(`success step visible: ${success}`);
console.log(`CONTACT_USED=${CONTACT}`);

await browser.close();
process.exit(success ? 0 : 1);
