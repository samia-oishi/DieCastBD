/**
 * Fill descriptions / specifications / features on products that were added to the
 * live site without them. Content comes from the local inventory source of truth
 * (Diecast/_tools/inventory.json).
 *
 * SAFETY: this script writes ONLY content fields. price, salePrice, costPrice,
 * stock, thumbnail, gallery, status and slug are never in the update payload, so a
 * manual price or a live sale can't be clobbered by running it.
 *
 *   node scripts/fill-product-content.mjs --dry-run     # show the diff, write nothing
 *   node scripts/fill-product-content.mjs --only H-001  # single SKU
 *   node scripts/fill-product-content.mjs               # apply
 *
 * By default it only fills fields that are EMPTY. Pass --overwrite to replace
 * existing content too.
 */
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const overwrite = args.includes("--overwrite");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx > -1 ? args[onlyIdx + 1] : null;

const INV = "/Users/niaz/Documents/Daily Workspace/Diecast/_tools/inventory.json";

// Content fields only. Deliberately excludes price/salePrice/costPrice/stock/
// thumbnail/gallery/status/slug — see the safety note above.
const CONTENT = ["description", "specifications", "features", "series", "modelNumber",
                 "material", "color", "scale", "manufacturer", "tags"];

const isEmpty = (v) =>
  v === undefined || v === null || v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

function tagsFor(r) {
  const t = new Set();
  for (const w of String(r.title).toLowerCase()
      .replace(/hot wheels|—|'/g, " ").split(/[^a-z0-9]+/)) {
    if (w.length > 2 && !["the", "and", "with", "car"].includes(w)) t.add(w);
  }
  if (r.brand) t.add(String(r.brand).toLowerCase());
  if (r.series) t.add(String(r.series).replace(/\s*\(\d+\/\d+\)/, "").toLowerCase());
  if (r.cat) t.add(String(r.cat).toLowerCase());
  return [...t].slice(0, 12);
}

function payloadFor(r) {
  const specs = { ...(r.specs || {}) };
  if (r.wt) specs.Weight = `${r.wt} g`;
  return {
    description: r.desc,
    specifications: specs,
    features: r.feats || [],
    series: r.series || "",
    modelNumber: r.model || "",
    material: r.material || "",
    color: r.color || "",
    scale: r.scale || "1:64",
    manufacturer: r.maker || "",
    tags: tagsFor(r),
  };
}

const short = (v, n = 68) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? s.slice(0, n) + "…" : s;
};

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error("No Mongo URI in .env (MONGODB_URI / MONGO_URI / DATABASE_URL)");
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}\n`);

  const Product = mongoose.connection.collection("products");
  const rows = JSON.parse(fs.readFileSync(INV, "utf8"));
  const list = (rows.rows || rows).filter((r) => (only ? r.sku === only : true));

  let touched = 0, skipped = 0, missing = 0;
  for (const r of list) {
    const cur = await Product.findOne({ sku: r.sku });
    if (!cur) { missing++; continue; }

    const want = payloadFor(r);
    const set = {};
    for (const k of CONTENT) {
      if (want[k] === undefined) continue;
      if (isEmpty(want[k])) continue;                 // nothing to write
      if (!overwrite && !isEmpty(cur[k])) continue;   // already has content
      if (JSON.stringify(cur[k]) === JSON.stringify(want[k])) continue;
      set[k] = want[k];
    }
    if (!Object.keys(set).length) { skipped++; continue; }

    console.log(`\n📦 ${r.sku}  ${short(cur.title, 56)}`);
    for (const [k, v] of Object.entries(set)) {
      console.log(`   ${k.padEnd(15)} ${isEmpty(cur[k]) ? "(empty)" : short(cur[k], 34)}  →  ${short(v)}`);
    }
    if (!dryRun) await Product.updateOne({ _id: cur._id }, { $set: set });
    touched++;
  }

  console.log(`\n${"─".repeat(66)}`);
  console.log(dryRun ? "DRY RUN — nothing written." : "✅ Written.");
  console.log(`updated ${touched} · already complete ${skipped} · not on site ${missing}`);
  if (dryRun) console.log("Apply with: node scripts/fill-product-content.mjs");
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
