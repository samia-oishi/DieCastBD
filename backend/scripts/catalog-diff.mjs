/**
 * Catalog update helper — backup + dry-run diff for the July 2026 inventory refresh.
 *
 *   node scripts/catalog-diff.mjs            # backup live products, print the diff, write NOTHING
 *   node scripts/catalog-diff.mjs --backup-only
 *
 * The actual write is done by the repo's own seed (`npm run seed`), which upserts
 * products by SKU via findOneAndUpdate — non-destructive: fields absent from the
 * payload (thumbnail, gallery, reservedStock, …) are left untouched, and
 * settings/coupons/pages use $setOnInsert so they are never clobbered.
 *
 * Restore from a backup:
 *   node scripts/catalog-diff.mjs --restore backups/products-<timestamp>.json
 */
import fs from "node:fs/promises";
import path from "node:path";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Product } from "../src/modules/products/product.model.js";
import { products as incoming } from "../src/seeds/data/catalog.data.js";

const FIELDS = [
  // salePrice intentionally excluded: the generator omits it, so the seed never
  // changes it (owner manages sale prices manually).
  "title", "series", "modelNumber", "manufacturer", "scale", "material", "color",
  "description", "price", "costPrice", "stock",
];

const args = process.argv.slice(2);
const restoreIdx = args.indexOf("--restore");
const backupOnly = args.includes("--backup-only");

const money = (n) => (n == null ? "—" : `৳${Number(n).toLocaleString()}`);
const short = (v, n = 58) => {
  if (v == null) return "—";
  const s = String(v);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};

async function backup() {
  const dir = path.join(process.cwd(), "backups");
  await fs.mkdir(dir, { recursive: true });
  const docs = await Product.find({}).select("+costPrice").lean();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `products-${stamp}.json`);
  await fs.writeFile(file, JSON.stringify(docs, null, 2));
  console.log(`\n💾 Backup: ${docs.length} products → ${path.relative(process.cwd(), file)}`);
  return docs;
}

async function restore(file) {
  const docs = JSON.parse(await fs.readFile(file, "utf8"));
  let n = 0;
  for (const d of docs) {
    const { _id, __v, createdAt, updatedAt, ...rest } = d;
    await Product.findByIdAndUpdate(_id, rest, { runValidators: false });
    n++;
  }
  console.log(`↩️  Restored ${n} products from ${path.basename(file)}`);
}

async function diff(live) {
  const bySku = new Map(live.map((d) => [d.sku, d]));
  let changed = 0, added = 0;
  const stockDelta = [];

  console.log(`\n${"─".repeat(96)}`);
  console.log("DRY RUN — what `npm run seed` would change (nothing written yet)");
  console.log("─".repeat(96));

  for (const item of incoming) {
    const cur = bySku.get(item.sku.toUpperCase());
    if (!cur) {
      console.log(`\n🆕 ${item.sku}  NEW — ${item.title}`);
      added++;
      continue;
    }
    const deltas = [];
    for (const f of FIELDS) {
      const a = cur[f] ?? null;
      const b = item[f] ?? null;
      if (String(a) !== String(b)) deltas.push([f, a, b]);
    }
    if (!deltas.length) continue;
    changed++;
    console.log(`\n📦 ${item.sku}  ${short(cur.title, 62)}`);
    for (const [f, a, b] of deltas) {
      const isMoney = ["price", "salePrice", "costPrice"].includes(f);
      const fmt = isMoney ? money : (v) => short(v);
      const flag = f === "stock" && Number(b) !== Number(a) ? "  ⚠️ STOCK" : "";
      console.log(`   ${f.padEnd(13)} ${String(fmt(a)).padEnd(60)} →  ${fmt(b)}${flag}`);
      if (f === "stock") stockDelta.push([item.sku, a, b]);
    }
  }

  const liveSkus = new Set(incoming.map((i) => i.sku.toUpperCase()));
  const orphans = live.filter((d) => !liveSkus.has(d.sku) && !d.isDeleted);
  if (orphans.length) {
    console.log(`\n⚠️  ${orphans.length} product(s) in the DB are NOT in the new catalog (they will be left untouched):`);
    orphans.forEach((o) => console.log(`   ${o.sku}  ${short(o.title)}`));
  }

  console.log(`\n${"─".repeat(96)}`);
  console.log(`SUMMARY: ${changed} updated · ${added} new · ${orphans.length} untouched · ${incoming.length} in catalog file`);
  if (stockDelta.length) {
    console.log(`\nStock changes:`);
    stockDelta.forEach(([s, a, b]) => console.log(`   ${s.padEnd(10)} ${a} → ${b}`));
  }
  console.log(`\nTo APPLY:  npm run seed`);
  console.log(`To UNDO:   node scripts/catalog-diff.mjs --restore backups/<file>.json\n`);
}

async function run() {
  await connectDB();
  if (restoreIdx !== -1) {
    await restore(args[restoreIdx + 1]);
  } else {
    const live = await backup();
    if (!backupOnly) await diff(live);
  }
  await disconnectDB();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
