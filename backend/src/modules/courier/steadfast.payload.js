import { formatAddressArea } from "../../utils/address.js";

/** Builds and validates the body Steadfast's POST /create_order expects.
 *
 * Pure and network-free on purpose, like analytics/orderMetrics.js: this is the
 * function that decides how much money a courier collects from a customer at
 * their door, and it needs to be testable without creating a real parcel.
 *
 * Field limits are Steadfast's own, from their API documentation:
 *   invoice            unique, alphanumeric plus - and _
 *   recipient_name     within 100 characters
 *   recipient_phone    must be 11 digits
 *   recipient_address  within 250 characters
 *   cod_amount         cannot be less than 0
 *   note               optional, delivery instructions
 *   item_description   optional, item names and other information
 *
 * There is NO district / thana / area / city parameter — `recipient_address` is
 * the only location field the API has. Their portal fills its own District and
 * Thana dropdowns by parsing that one string, which is why buildRecipientAddress
 * below is careful about how the address ENDS.
 */

/** Statuses Steadfast will never move away from — a finished parcel. */
export const TERMINAL_STATUSES = ["delivered", "partial_delivered", "cancelled"];

export const isTerminal = (status) => TERMINAL_STATUSES.includes(status);

/** Normalises a Bangladeshi mobile number to the bare 11 digits Steadfast wants.
 *
 * Accepts what customers actually type — spaces, dashes, a +880 or 880 country
 * prefix — and returns null when the result still isn't a valid 11-digit BD
 * mobile. Null must be treated as a hard failure by the caller: a parcel with a
 * wrong number is undeliverable, and the courier cannot ask us for a correction.
 */
export function normalizeBdPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  // 8801712345678 -> 01712345678. Only strip 880 when what remains starts with
  // the 1 of an operator prefix, so a local number is never mangled.
  const local = digits.length === 13 && digits.startsWith("8801") ? `0${digits.slice(3)}` : digits;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}

/** Steadfast has no district/thana parameter — `recipient_address` is the only
 * location field their API accepts (see the header comment). Their portal
 * derives the District/Thana dropdowns by PARSING this string, so the ending
 * has to be the courier's own spelling of "<Thana>, <District>", verbatim.
 *
 * Customers usually type the area themselves too, which is how the address
 * ended up reading "... Rampura, Dhaka 1219, Rampura, Dhaka City". So any
 * segment the customer wrote that just repeats the thana or district is
 * dropped, and the canonical pair is appended once. A postcode found inside a
 * dropped segment is kept, hyphenated onto the district the way Steadfast's own
 * documented example does it ("Dhanmondi, Dhaka-1209").
 */
const letters = (s) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");

/** True when a customer-typed segment is just the thana or district again.
 * Prefix matching is what catches "Dhaka" against the district "Dhaka City";
 * the 4-character floor stops a short fragment swallowing a real place name. */
function duplicatesArea(segment, thana, district) {
  const seg = letters(segment);
  if (seg.length < 4) return false;
  const t = letters(thana);
  const d = letters(district);
  if (t && seg === t) return true;
  return Boolean(d) && (seg === d || d.startsWith(seg));
}

export function buildRecipientAddress(shippingAddress, limit = 250) {
  const a = shippingAddress ?? {};
  // Legacy orders (pre-dropdown) carry a free-text `city` and no thana — then
  // the city IS the district, and there is no thana to append.
  const thana = (a.thana ?? "").trim();
  const district = (a.district || a.city || "").trim();

  const segments = [a.addressLine1, a.addressLine2]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let postcode = (a.postalCode ?? "").trim();
  const kept = [];
  for (const seg of segments) {
    if (duplicatesArea(seg, thana, district)) {
      // "Dhaka 1219" is a duplicate of the district plus a postcode worth keeping.
      const found = seg.match(/\b\d{4}\b/);
      if (found && !postcode) postcode = found[0];
      continue;
    }
    kept.push(seg);
  }

  const tail = [thana, district].filter(Boolean).join(", ");
  const line = [...kept, tail].filter(Boolean).join(", ") + (postcode ? `-${postcode}` : "");

  if (line.length <= limit) return line;
  const cut = line.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > limit - 40 ? cut.slice(0, lastSpace) : cut).trim();
}

/** What is in the box, for Steadfast's `item_description`.
 * The merchant asked for the product names with quantities ("1x Hot Wheels
 * Premium"), which is also what a rider reads back when a customer disputes a
 * delivery. Titles are the snapshots stored on the order, so a later product
 * rename never rewrites an old parcel. */
export function buildItemDescription(order, limit = 500) {
  const line = (order?.items ?? [])
    .map((i) => `${i.qty}x ${String(i.title ?? "").trim()}`.trim())
    .filter((s) => s !== "0x" && s.length > 2)
    .join(", ");
  return line.length <= limit ? line : line.slice(0, limit - 1).replace(/,[^,]*$/, "") + "…";
}

/** The merchant's standing handling instruction, in both languages the riders
 * read. Diecast models are die-cast metal with glass-like display cases, and
 * this is the note they were previously typing into Steadfast by hand. */
export const FRAGILE_NOTE = "Fragile item please handle carefully. ভঙ্গুর পণ্য, অনুগ্রহ করে সাবধানে হ্যান্ডেল করুন।";

/** The customer's own delivery instruction comes FIRST — it is the one thing on
 * the parcel that is specific to this delivery ("call before coming", "gate 2")
 * and must not be pushed out of sight by boilerplate. */
export function buildNote(order, limit = 250) {
  const own = String(order?.deliveryNote ?? "").replace(/\s+/g, " ").trim();
  const note = own ? `${own} — ${FRAGILE_NOTE}` : FRAGILE_NOTE;
  return note.length <= limit ? note : note.slice(0, limit).trim();
}

/** Why the courier cannot be given this order, or null when it can. */
export function courierBlockReason(order) {
  if (!order) return "Order not found";
  if (order.courier?.consignmentId) {
    return `Already sent to the courier as consignment ${order.courier.consignmentId}`;
  }
  if (["cancelled", "refunded"].includes(order.status)) {
    return `This order is ${order.status} — it should not be sent to the courier`;
  }
  if (!order.shippingAddress?.addressLine1) return "This order has no shipping address";
  if (!normalizeBdPhone(order.shippingAddress?.phone ?? order.phone)) {
    return `"${order.shippingAddress?.phone ?? order.phone}" is not a valid 11-digit Bangladeshi mobile number`;
  }
  return null;
}

export function buildCreateOrderPayload(order) {
  const blocked = courierBlockReason(order);
  if (blocked) throw new Error(blocked);

  const address = order.shippingAddress;
  const itemDescription = buildItemDescription(order);
  return {
    invoice: order.orderNumber,
    recipient_name: String(address.recipientName ?? "").trim().slice(0, 100),
    recipient_phone: normalizeBdPhone(address.phone ?? order.phone),
    recipient_address: buildRecipientAddress(address),
    // amountDue, NEVER total. Orders can be partly prepaid by bKash/BanglaQR
    // (paymentOption partialAdvance/deliveryOnly — see plan.md #61), and the
    // courier must collect only the remainder. Sending `total` would charge the
    // customer again at their door for money they have already paid.
    cod_amount: Math.max(0, Math.round(order.amountDue ?? 0)),
    note: buildNote(order),
    ...(itemDescription ? { item_description: itemDescription } : {}),
  };
}
