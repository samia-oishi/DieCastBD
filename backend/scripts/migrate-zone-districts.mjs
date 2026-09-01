/**
 * Backfills shippingZones[].districts / .isDefault on the live settings doc.
 *
 * Checkout now derives the delivery zone from the customer's district instead
 * of asking them to pick it (plan.md #100). The mapping lives in the DATA, on
 * each zone — so until this runs, no zone lists any district and every address
 * falls through to the catch-all. Which is the *outside* zone. Which means
 * every Dhaka customer is quietly charged ৳120 instead of ৳70 the moment the
 * new build goes out.
 *
 * So this is not an optional cleanup: it has to run against production before
 * (or with) the deploy.
 *
 * Idempotent. Dry-run by default:
 *   node --env-file=.env scripts/migrate-zone-districts.mjs
 *   node --env-file=.env scripts/migrate-zone-districts.mjs --write
 */
import mongoose from "mongoose";

// "Dhaka City" is Steadfast's own name for the metro area, and the only thing
// the merchant wants at the inside rate ("Dhaka City only") — Dhaka Sub-Urban
// (Savar, Ashulia, Keraniganj, Dohar, Dhamrai…) is a separate district in
// Steadfast's list and pays the outside rate.
//
// Plain "Dhaka" rides along because addresses saved before the district
// dropdown existed store that older name, and the lookup is a literal string
// compare. Two live addresses are in exactly that state today.
const INSIDE = ["Dhaka City", "Dhaka"];

const write = process.argv.includes("--write");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Run with --env-file=.env");
  process.exit(1);
}

await mongoose.connect(uri);
const col = mongoose.connection.collection("settings");

try {
  const doc = await col.findOne({}, { projection: { shippingZones: 1 } });
  if (!doc) throw new Error("No settings document — run `npm run seed` first.");

  const zones = doc.shippingZones ?? [];
  if (zones.length === 0) throw new Error("No shipping zones configured; nothing to map.");

  // Match on the zone NAME here and only here: this is a one-off backfill of
  // the very data that exists so the running code never has to. If the names
  // have been edited since, the script says so rather than guessing.
  const insideIdx = zones.findIndex((z) => /inside/i.test(z.name ?? ""));
  if (insideIdx === -1) {
    throw new Error(
      `No zone matching /inside/i. Zones are: ${zones.map((z) => `"${z.name}"`).join(", ")}. ` +
        `Set the districts by hand in Admin → Settings → Shipping instead.`
    );
  }

  const next = zones.map((z, i) => ({
    ...z,
    // Preserve anything already set — re-running must not undo a merchant edit.
    districts: z.districts?.length ? z.districts : i === insideIdx ? INSIDE : [],
    isDefault: z.isDefault ?? i !== insideIdx,
  }));

  // Exactly one catch-all, or addresses outside every list have no zone.
  const defaults = next.filter((z) => z.isDefault);
  if (defaults.length !== 1) {
    throw new Error(`Expected exactly one "everywhere else" zone, found ${defaults.length}.`);
  }

  for (const z of next) {
    const label = z.isDefault ? "everywhere else" : z.districts.join(", ") || "(no districts — unreachable)";
    console.log(`  ${z.name.padEnd(16)} ৳${String(z.fee).padEnd(5)} ${z.requiresPrepay ? "prepay" : "COD  "}  ${label}`);
  }

  if (JSON.stringify(next) === JSON.stringify(zones)) {
    console.log("\nAlready migrated — nothing to write.");
  } else if (write) {
    // Touch updatedAt too: a raw driver write skips Mongoose timestamps, and
    // this project has shipped a stale-sitemap bug from exactly that before.
    await col.updateOne({ _id: doc._id }, { $set: { shippingZones: next, updatedAt: new Date() } });
    console.log("\nWritten.");
  } else {
    console.log("\nDry run — re-run with --write to apply.");
  }
} finally {
  await mongoose.disconnect();
}
