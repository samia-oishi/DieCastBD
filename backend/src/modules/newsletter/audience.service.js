import { NewsletterSubscriber } from "./newsletter.model.js";
import { RestockAlert } from "../restockAlerts/restockAlert.model.js";
import { User } from "../users/user.model.js";
import { isEmail } from "../restockAlerts/contactType.js";

/** Every email address the shop holds, and where each one came from.
 *
 * The Newsletter page used to show only the storefront signup form — 7 of the
 * 32 addresses actually on file. The rest arrived through the door the merchant
 * never gets to see: people who made an account, guests who typed an email at
 * checkout, and people waiting on a restock.
 *
 * WHY THE SOURCE IS KEPT PER ADDRESS, and not flattened into one list: these
 * are not the same kind of permission. Someone who filled in the newsletter box
 * asked for marketing. Someone who typed an email to receive their order
 * receipt did not. Merging them would leave no way to tell, so every row names
 * its origin and the export carries it too. Nothing here silently adds anyone
 * to the newsletter list — this is a view over what already exists.
 */
export const AUDIENCE_SOURCES = ["newsletter", "customer", "order", "notify"];

const normalize = (value) => String(value ?? "").trim().toLowerCase();

/** Builds the deduplicated audience in memory.
 *
 * Deliberately not a $unionWith aggregation across four collections. The whole
 * audience is a few dozen rows against a catalogue of 78 products, the four
 * queries are each indexed and tiny, and merging here keeps the "which sources
 * does this address appear in" logic readable in one place. If this ever grows
 * past a few thousand addresses it should become a real aggregation — the
 * per-source queries below are already shaped for it.
 */
async function collect() {
  const [subscribers, accounts, guests, alerts] = await Promise.all([
    NewsletterSubscriber.find({ isActive: true }).select("_id email subscribedAt").lean(),
    // A real account. `isGuest: { $ne: true }` rather than `false` so documents
    // written before the flag existed still read as customers.
    User.find({ email: { $ne: null }, isGuest: { $ne: true } }).select("email name createdAt").lean(),
    // Guest checkout extends User rather than having its own model, so the flag
    // is the only thing separating "gave us an email to get a receipt" from
    // "signed up".
    User.find({ email: { $ne: null }, isGuest: true }).select("email name createdAt").lean(),
    RestockAlert.find({}).select("contact createdAt").lean(),
  ]);

  const byEmail = new Map();

  const add = (rawEmail, source, at, extra = {}) => {
    const email = normalize(rawEmail);
    if (!email) return;
    const existing = byEmail.get(email);
    if (!existing) {
      byEmail.set(email, { email, sources: [source], firstSeen: at ?? null, ...extra });
      return;
    }
    if (!existing.sources.includes(source)) existing.sources.push(source);
    // Earliest contact wins: it answers "how long have we had this address",
    // which is what the column is for.
    if (at && (!existing.firstSeen || at < existing.firstSeen)) existing.firstSeen = at;
    // A name from any source beats no name at all.
    if (!existing.name && extra.name) existing.name = extra.name;
    if (!existing.subscriberId && extra.subscriberId) existing.subscriberId = extra.subscriberId;
  };

  for (const s of subscribers) add(s.email, "newsletter", s.subscribedAt, { subscriberId: String(s._id) });
  for (const u of accounts) add(u.email, "customer", u.createdAt, { name: u.name });
  for (const u of guests) add(u.email, "order", u.createdAt, { name: u.name });
  for (const a of alerts) {
    // Restock alerts accept a BD phone number as well as an email, because the
    // storefront lets people leave either. Phone-shaped contacts are skipped
    // here rather than shown as broken rows: this list feeds a CSV meant for an
    // email tool, and a phone number in an email column corrupts the import.
    if (isEmail(a.contact)) add(a.contact, "notify", a.createdAt);
  }

  return [...byEmail.values()];
}

/** Counts per source, plus the deduplicated total.
 *
 * `all` is the size of the union, NOT the sum of the others — an address that
 * both signed up and ordered is one person, and a chip row that added up to
 * more than the list it filters would be read as a bug.
 */
export async function getAudienceCounts() {
  const people = await collect();
  const counts = { all: people.length };
  for (const source of AUDIENCE_SOURCES) {
    counts[source] = people.filter((p) => p.sources.includes(source)).length;
  }
  return counts;
}

export async function listAudience({ source, q, page = 1, limit = 50 }) {
  let people = await collect();

  if (source && source !== "all") people = people.filter((p) => p.sources.includes(source));
  if (q) {
    const needle = normalize(q);
    people = people.filter((p) => p.email.includes(needle) || normalize(p.name).includes(needle));
  }

  // Newest first, matching the page it replaces. Undated rows sort last rather
  // than being treated as epoch-old and jumping to the bottom of a long list.
  people.sort((a, b) => {
    if (!a.firstSeen) return 1;
    if (!b.firstSeen) return -1;
    return new Date(b.firstSeen) - new Date(a.firstSeen);
  });

  const total = people.length;
  const skip = (page - 1) * limit;
  return {
    items: people.slice(skip, skip + limit),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
