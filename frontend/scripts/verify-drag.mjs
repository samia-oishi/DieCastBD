// Verify click-and-drag horizontal scroll works on the home carousels.
import { chromium } from "playwright";

const browser = await chromium.launch();
for (const width of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const carousel = page.locator("[data-carousel]").first();
  const box = await carousel.boundingBox();
  if (!box) { console.log(`${width}: no carousel`); await ctx.close(); continue; }
  const before = await carousel.evaluate((el) => el.scrollLeft);
  // simulate a leftward mouse drag across the carousel
  const cy = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 40, cy);
  await page.mouse.down();
  for (let x = box.width - 40; x > 40; x -= 30) {
    await page.mouse.move(box.x + x, cy);
    await page.waitForTimeout(10);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await carousel.evaluate((el) => el.scrollLeft);
  console.log(`${width}px: scrollLeft ${before} -> ${after} — drag ${after > before ? "WORKS" : "FAILED"}`);
  await ctx.close();
}
await browser.close();
