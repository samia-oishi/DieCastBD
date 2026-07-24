/**
 * Owner rule (24 Jul 2026): a sale price must be a genuine discount.
 * Clears salePrice on any product where salePrice >= price (equal = no discount,
 * greater = inverted). Run after any retail-price change / seed.
 *
 *   node scripts/clear-nondiscount-sales.mjs            # apply
 *   node scripts/clear-nondiscount-sales.mjs --dry-run  # report only, write nothing
 */
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Product } from "../src/modules/products/product.model.js";

const dry = process.argv.includes("--dry-run");

async function run() {
  await connectDB();
  const withSale = await Product.find({ salePrice: { $ne: null }, isDeleted: false })
    .select("sku price salePrice").lean();
  const bad = withSale.filter((p) => p.salePrice >= p.price);
  for (const p of bad) {
    console.log(`${dry ? "[dry] " : ""}clear ${p.sku}: sale ৳${p.salePrice} >= retail ৳${p.price}`);
    if (!dry) await Product.updateOne({ _id: p._id }, { $set: { salePrice: null } });
  }
  console.log(`${bad.length} non-discount sale price(s) ${dry ? "would be" : ""} cleared.`);
  await disconnectDB();
}
run().catch((e) => { console.error(e); process.exit(1); });
