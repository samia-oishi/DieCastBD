/**
 * Upload verified product photos to Cloudinary and attach them as product thumbnails.
 *
 * Input: a JSON map of { "SKU": "/absolute/path/to/verified.jpg" }
 * Every file must have been visually checked against the product first — this
 * script does no verification of its own, it only transports.
 *
 *   node scripts/upload-product-photos.mjs --map <file.json> --dry-run
 *   node scripts/upload-product-photos.mjs --map <file.json>
 *   node scripts/upload-product-photos.mjs --map <file.json> --replace   overwrite existing thumbnails
 *
 * A product that already has a thumbnail is SKIPPED unless --replace is given,
 * so re-running can never clobber a photo the owner uploaded by hand.
 */
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({ path: path.join(process.cwd(), ".env") });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const replace = args.includes("--replace");
const mapIdx = args.indexOf("--map");
if (mapIdx === -1) throw new Error("--map <file.json> is required");
const MAP = JSON.parse(fs.readFileSync(args[mapIdx + 1], "utf8"));

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  console.log(`Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);
  const Products = mongoose.connection.collection("products");

  let done = 0, skipped = 0, missing = 0, failed = 0;
  for (const [sku, file] of Object.entries(MAP)) {
    const p = await Products.findOne({ sku });
    if (!p) { console.log(`✗ ${sku}  not on the site`); missing++; continue; }
    if (p.thumbnail && !replace) { console.log(`· ${sku}  already has a photo — skipped`); skipped++; continue; }
    if (!fs.existsSync(file)) { console.log(`✗ ${sku}  file missing: ${file}`); missing++; continue; }

    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    if (dryRun) { console.log(`↑ ${sku}  would upload ${path.basename(file)} (${kb} KB)`); done++; continue; }
    try {
      const res = await cloudinary.uploader.upload(file, {
        folder: "diecastbd/products",
        public_id: `${sku.toLowerCase()}-${Date.now().toString(36)}`,
        overwrite: false,
        resource_type: "image",
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
      });
      const thumb = { url: res.secure_url, cloudinaryId: res.public_id };
      const set = { thumbnail: thumb, updatedAt: new Date() };
      // seed the gallery too when it is empty, so the PDP has something to show
      if (!p.gallery || !p.gallery.length) set.gallery = [thumb];
      await Products.updateOne({ _id: p._id }, { $set: set });
      console.log(`✓ ${sku}  ${kb} KB → ${res.public_id}`);
      done++;
    } catch (e) {
      console.log(`✗ ${sku}  upload failed: ${String(e.message).slice(0, 90)}`);
      failed++;
    }
  }
  console.log(`\n${"─".repeat(64)}`);
  console.log(dryRun ? "DRY RUN — nothing uploaded." : "✅ Done.");
  console.log(`uploaded ${done} · already had a photo ${skipped} · missing ${missing} · failed ${failed}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
