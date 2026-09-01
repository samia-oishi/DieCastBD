/**
 * Regenerates src/lib/bdGeo.js from Steadfast's own coverage list.
 *
 *   SF_KEY=... SF_SECRET=... node scripts/generate-bd-geo.mjs
 *
 * Reads GET /police_stations (portal.packzy.com/api/v1) with the merchant's API
 * credentials and writes the district -> delivery-zone data the checkout address
 * picker uses, attaching the official administrative spellings as hidden search
 * aliases. See the header of src/lib/bdGeo.js for why the courier's list is the
 * source of truth rather than the official upazila data.
 *
 * Credentials are read from the environment and never written to the repo.
 * Re-run this when Steadfast adds coverage; read the printed pairings before
 * committing — the DENY/MANUAL lists below exist because edit distance alone
 * proposed aliasing genuinely different places to each other.
 */
import { readFileSync, writeFileSync } from "node:fs";
const res = await fetch("https://portal.packzy.com/api/v1/police_stations", {
  headers: {
    "Api-Key": process.env.SF_KEY,
    "Secret-Key": process.env.SF_SECRET,
    "Content-Type": "application/json",
  },
});
if (!res.ok) { console.error(`Steadfast returned HTTP ${res.status} — check SF_KEY / SF_SECRET.`); process.exit(1); }
const sf = (await res.json()).data;
const ours = (await import(`${process.cwd()}/src/lib/bdGeo.js?v=50`)).BD_DISTRICTS;

const DMAP = { "Dhaka City":"Dhaka","Dhaka Sub-Urban":"Dhaka","Bogra":"Bogura","Chittagong":"Chattogram",
  "Cumilla":"Comilla","Barishal":"Barisal","Kustia":"Kushtia","Narshindi":"Narsingdi","Laxmipur":"Lakshmipur",
  "Shatkhira":"Satkhira","Panchgarh":"Panchagarh","Khagrachori":"Khagrachhari","Jhalokati":"Jhalakathi" };
const JUNK = new Set(["zone not clear"]);

// Reviewed by hand — edit distance cannot judge these.
const DENY = new Set(["Chandpur|Matlab North|Matlab South"]);
const MANUAL = {
  "Chandpur|Motlab dokkhin": ["Matlab South"],
  // Bengali/English pairs for the same place — no string metric can see these.
  "Sylhet|South Surma": ["Dakshinsurma"],
  "Sylhet|Jalalabad": ["Bimanbandar"],
};

// Comparison key. Drops parenthetical qualifiers ("Airport (Rajshahi)") and the
// administrative words Steadfast and the police lists append inconsistently
// ("Chandrima Thana", "Mirpur Model"), then folds the ph/f transliteration —
// so the same place written three ways still compares equal.
const core = (s) => s.toLowerCase()
  .replace(/\(.*?\)/g, " ")
  .replace(/\b(thana|model|upazila|paurashava|pourashava)\b/g, " ")
  .replace(/ph/g, "f")
  .replace(/[^a-z0-9]/g, "");

const lev = (a, b) => {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    m[i][j] = Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return m[a.length][b.length];
};

const byDistrict = new Map();
const sfSpelling = new Map();
for (const d of sf) {
  const name = DMAP[d.name] ?? d.name;
  if (name !== d.name) sfSpelling.set(name, d.name.replace(/ (City|Sub-Urban)$/, ""));
  if (!byDistrict.has(name)) byDistrict.set(name, new Map());
  for (const s of d.policestations) {
    const label = s.name.trim().replace(/\s+/g, " ");
    if (JUNK.has(label.toLowerCase())) continue;
    byDistrict.get(name).set(label.toLowerCase(), label);
  }
}

const pairings = [], orphans = [];
const out = [];
for (const d of ours) {
  const bucket = byDistrict.get(d.name);
  if (!bucket) { out.push({ name: d.name, division: d.division, aka: d.aka, thanas: d.thanas.map(n => ({ n })) }); continue; }
  const labels = [...bucket.values()];
  const theirCores = new Set(labels.map(core));

  // Attach each of OUR names to the Steadfast entry it means, so a customer can
  // still search by the official spelling and land on the courier's name.
  const aliasFor = new Map(labels.map((l) => [l, []]));
  for (const o of d.thanas) {
    const manualTarget = Object.entries(MANUAL).find(([k, v]) => k.startsWith(`${d.name}|`) && v.includes(o));
    if (manualTarget) { aliasFor.get(manualTarget[0].split("|")[1])?.push(o); continue; }
    if (theirCores.has(core(o)) && labels.some((l) => l.toLowerCase() === o.toLowerCase())) continue; // identical, no alias needed
    if (labels.some((x) => x.toLowerCase() === o.toLowerCase())) continue;   // our name is its own entry
    const oc = core(o);
    const hit = labels.find((l) => {
      if (DENY.has(`${d.name}|${l}|${o}`)) return false;
      const lc = core(l);
      // Near-miss spelling.
      if (lev(oc, lc) <= 2 && Math.abs(oc.length - lc.length) <= 3) return true;
      // One name qualifies the other: Steadfast writes "Kotwali - CTG" and
      // "Bayazid Bostami", and lists a single "Uttara"/"Tongi" where the police
      // split them East/West. Prefix, not substring, and >=5 chars, so short
      // names can't swallow unrelated places.
      const [short, long] = oc.length <= lc.length ? [oc, lc] : [lc, oc];
      return short.length >= 5 && long.startsWith(short);
    });
    if (hit) { aliasFor.get(hit).push(o); pairings.push(`${d.name}: "${hit}"  <-  "${o}"`); }
    else if (!labels.some((x) => x.toLowerCase() === o.toLowerCase())) orphans.push(`${d.name}: ${o}`);
  }

  const thanas = labels.map((l) => {
    const a = [...new Set(aliasFor.get(l))].filter((x) => x.toLowerCase() !== l.toLowerCase());
    return a.length ? { n: l, a } : { n: l };
  }).sort((x, y) => x.n.localeCompare(y.n));

  const aka = [...new Set([...(d.aka ?? []), sfSpelling.get(d.name)].filter(Boolean).filter((x) => x !== d.name))];
  out.push({ name: d.name, division: d.division, aka: aka.length ? aka : undefined, thanas });
}

console.log("districts:", out.length, "| thanas:", out.reduce((n, d) => n + d.thanas.length, 0));
console.log("aliases attached:", pairings.length);
console.log("our names with NO Steadfast equivalent at all:", orphans.length);
console.log("\n=== orphans (places Steadfast does not list) ===");
orphans.forEach((o) => console.log("  " + o));
writeFileSync(new URL("../src/lib/bdGeo.districts.json", import.meta.url), JSON.stringify(out, null, 0));
console.log("\nwrote src/lib/bdGeo.districts.json — fold into bdGeo.js");
