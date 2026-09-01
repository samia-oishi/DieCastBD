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

/** The full one-line address, capped at Steadfast's 250 characters.
 * Truncates on a word boundary where it can, so a cut address still reads. */
export function buildRecipientAddress(shippingAddress, limit = 250) {
  const line = [shippingAddress?.addressLine1, shippingAddress?.addressLine2, formatAddressArea(shippingAddress)]
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();
  if (line.length <= limit) return line;
  const cut = line.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > limit - 40 ? cut.slice(0, lastSpace) : cut).trim();
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
    ...(order.deliveryNote ? { note: String(order.deliveryNote).trim().slice(0, 250) } : {}),
  };
}
