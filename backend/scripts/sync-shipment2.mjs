/**
 * Sync the shipment-2 catalogue into the live site.
 *
 * Source of truth: Diecast/_tools/s2/push_payload.json (regenerated from the
 * costing whenever a price or weight changes).
 *
 * ── Safe to re-run ──────────────────────────────────────────────────────────
 * The three things that can be wrong to overwrite are separated behind flags,
 * so re-running after a price change never disturbs stock or a manual sale:
 *
 *   node scripts/sync-shipment2.mjs --dry-run     preview everything, write nothing
 *   node scripts/sync-shipment2.mjs               create new + sync CONTENT only
 *   node scripts/sync-shipment2.mjs --prices      ... and push price + costPrice
 *   node scripts/sync-shipment2.mjs --receive     ... and add shipment stock (once)
 *   node scripts/sync-shipment2.mjs --only SKU    restrict to one SKU
 *   node scripts/sync-shipment2.mjs --live        clear the pre-order flag
 *
 * NEVER written under any flag: salePrice, thumbnail, gallery, reservedStock.
 *
 * --receive is guarded by a ledger (scripts/.shipment2-received.json) so running
 * it twice cannot double-count stock. Delete a SKU from that file to re-apply.
 *
 * New products are created as PRE-ORDER, because the goods are still in transit
 * from China. `--live` flips isPreOrder off once they land.
 */
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const doPrices = args.includes("--prices");
const doReceive = args.includes("--receive");
const goLive = args.includes("--live");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx > -1 ? args[onlyIdx + 1] : null;

const PAYLOAD = "/Users/niaz/Documents/Daily Workspace/Diecast/_tools/s2/push_payload.json";
const LEDGER = path.join(process.cwd(), "scripts", ".shipment2-received.json");

const BRAND_NAMES = {
  "hot-wheels-premium": "HotWheels Premium", hotwheels: "Hotwheels", "mini-gt": "MINI GT",
  tomica: "Tomica", gcd: "GCD", "star-race": "STAR RACE", cca: "CCA", generic: "Generic",
};
const CATEGORY_NAMES = {
  "premium-singles": "Premium Singles", mainlines: "Mainlines", "multi-packs": "Multi-Packs",
  accessories: "Accessories", "team-transport": "Team Transport",
};

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
   .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);

const short = (v, n = 60) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s == null ? "—" : s.length > n ? s.slice(0, n) + "…" : s;
};

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error("No Mongo URI in .env");
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}\n`);

  const Products = mongoose.connection.collection("products");
  const Brands = mongoose.connection.collection("brands");
  const Categories = mongoose.connection.collection("categories");

  let rows = JSON.parse(fs.readFileSync(PAYLOAD, "utf8"));
  if (only) rows = rows.filter((r) => r.sku === only);

  const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : {};

  // ── 1. brands & categories ────────────────────────────────────────────────
  const brandId = {}, catId = {};
  for (const slug of [...new Set(rows.map((r) => r.brandSlug))]) {
    let b = await Brands.findOne({ slug });
    if (!b) {
      const doc = { name: BRAND_NAMES[slug] || slug, slug, isActive: true, sortOrder: 0,
                    content: "", faqs: [], createdAt: new Date(), updatedAt: new Date() };
      console.log(`🏷  NEW BRAND      ${slug}  (${doc.name})`);
      if (!dryRun) { const r = await Brands.insertOne(doc); b = { _id: r.insertedId }; }
      else b = { _id: "dry-run" };
    }
    brandId[slug] = b._id;
  }
  for (const slug of [...new Set(rows.flatMap((r) => r.categorySlugs))]) {
    let c = await Categories.findOne({ slug });
    if (!c) {
      const doc = { name: CATEGORY_NAMES[slug] || slug, slug, parentCategory: null,
                    isActive: true, sortOrder: 0, content: "", faqs: [],
                    createdAt: new Date(), updatedAt: new Date() };
      console.log(`📂 NEW CATEGORY   ${slug}  (${doc.name})`);
      if (!dryRun) { const r = await Categories.insertOne(doc); c = { _id: r.insertedId }; }
      else c = { _id: "dry-run" };
    }
    catId[slug] = c._id;
  }

  // ── 2. products ───────────────────────────────────────────────────────────
  let created = 0, updated = 0, stocked = 0, skipped = 0;
  for (const r of rows) {
    const cur = await Products.findOne({ sku: r.sku });
    const content = {
      title: r.title, manufacturer: r.manufacturer, series: r.series,
      modelNumber: r.modelNumber, scale: r.scale, material: r.material, color: r.color,
      description: r.description, features: r.features, specifications: r.specifications,
      tags: r.tags, brand: brandId[r.brandSlug],
      category: r.categorySlugs.map((s) => catId[s]),
    };

    if (!cur) {
      // brand-new listing — everything is ours to set, including stock and price
      let slug = slugify(r.title);
      if (await Products.findOne({ slug })) slug = `${slug}-${r.sku.toLowerCase()}`;
      const doc = {
        ...content, sku: r.sku, slug,
        price: r.price, salePrice: null, costPrice: r.costPrice,
        stock: r.qty, reservedStock: 0,
        status: "active", isFeatured: false, isHeroProduct: false, isNewArrival: true,
        isPreOrder: !goLive, preOrderStartDate: goLive ? null : new Date(), preOrderEndDate: null,
        paymentOptions: ["cod", "full"], advancePaymentPercent: null,
        thumbnail: null, gallery: [], seo: {}, isDeleted: false,
        createdAt: new Date(), updatedAt: new Date(),
      };
      console.log(`\n🆕 ${r.sku}  ${short(r.title, 54)}`);
      console.log(`   brand ${r.brandSlug} · category ${r.categorySlugs.join(", ")}`);
      console.log(`   price ৳${r.price} · cost ৳${r.costPrice} · stock ${r.qty} · ${goLive ? "in stock" : "PRE-ORDER"}`);
      if (!dryRun) {
        await Products.insertOne(doc);
        ledger[r.sku] = { qty: r.qty, at: new Date().toISOString() };
      }
      created++;
      continue;
    }

    // Existing listing — merge, touching only what the flags allow.
    // A restock must never rewrite copy the owner already has live, so content
    // fields are only FILLED WHEN EMPTY here, never overwritten.
    const isEmpty = (v) =>
      v == null || v === "" ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
    const set = {};
    for (const [k, v] of Object.entries(content)) {
      if (isEmpty(v)) continue;                       // nothing worth writing
      if (!isEmpty(cur[k])) continue;                 // already has content — leave it
      if (JSON.stringify(cur[k]) !== JSON.stringify(v)) set[k] = v;
    }
    if (goLive && cur.isPreOrder) { set.isPreOrder = false; set.preOrderStartDate = null; }

    let stockNote = "";
    if (doReceive && !ledger[r.sku]) {
      const oldStock = cur.stock || 0;
      const oldCost = cur.costPrice || 0;
      set.stock = oldStock + r.qty;
      // weighted-average cost across the units now on hand
      set.costPrice = Math.round(
        (oldStock * oldCost + r.qty * r.costPrice) / (oldStock + r.qty)
      );
      // Those units are still in transit from China, so a restocked listing must
      // read pre-order too — otherwise it shows as buy-now stock that isn't here.
      if (!goLive) { set.isPreOrder = true; set.preOrderStartDate = new Date(); }
      stockNote = `   stock ${oldStock} → ${set.stock}  ·  cost ৳${oldCost} → ৳${set.costPrice} (weighted)  ·  ${goLive ? "in stock" : "PRE-ORDER"}`;
      stocked++;
    } else if (doReceive) {
      stockNote = `   stock unchanged — shipment already received on ${ledger[r.sku].at.slice(0, 10)}`;
    }
    if (doPrices && cur.price !== r.price) set.price = r.price;

    if (!Object.keys(set).length && !stockNote) { skipped++; continue; }
    console.log(`\n📦 ${r.sku}  ${short(cur.title, 54)}${r.existing ? "  [merge]" : ""}`);
    for (const [k, v] of Object.entries(set)) {
      console.log(`   ${k.padEnd(15)} ${short(cur[k], 30)}  →  ${short(v)}`);
    }
    if (stockNote) console.log(stockNote);
    if (!dryRun) {
      set.updatedAt = new Date();
      await Products.updateOne({ _id: cur._id }, { $set: set });
      if (doReceive && !ledger[r.sku]) ledger[r.sku] = { qty: r.qty, at: new Date().toISOString() };
    }
    updated++;
  }

  if (!dryRun) fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1));
  console.log(`\n${"─".repeat(70)}`);
  console.log(dryRun ? "DRY RUN — nothing written." : "✅ Written.");
  console.log(`created ${created} · updated ${updated} · stock applied ${stocked} · unchanged ${skipped}`);
  if (!doPrices) console.log("note: prices NOT pushed to existing listings (add --prices)");
  if (!doReceive) console.log("note: stock NOT added to existing listings (add --receive)");
  if (!goLive) console.log("note: new listings created as PRE-ORDER (use --live when stock lands)");
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
