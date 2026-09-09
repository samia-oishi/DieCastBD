/** Recalculates an order's money after an admin adjustment.
 *
 * Exists for orders that don't come through checkout the normal way: a customer
 * messages on Facebook, sends part of the payment by bKash, and agrees a
 * discount in conversation. The admin records what actually happened, and the
 * order's numbers have to stay internally consistent afterwards.
 *
 * Pure and DB-free so the arithmetic is testable on its own, like
 * analytics/orderMetrics.js and courier/steadfast.payload.js. Two invariants
 * hold on the way out, and both are enforced here rather than trusted:
 *
 *   total     === subtotal - discount + shippingFee
 *   amountDue === total - amountPaid          (amountPaid + amountDue === total)
 *
 * `subtotal` and `shippingFee` are never touched: they describe what was
 * actually ordered and where it is going, and an adjustment is about money, not
 * about rewriting the basket.
 */

function assertMoney(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a number`);
  }
  if (value < 0) throw new Error(`${label} cannot be negative`);
  return Math.round(value);
}

/**
 * @param order  the existing order (subtotal, shippingFee, discount, amountPaid)
 * @param patch  { advanceReceived?, discount? } — omitted fields keep their value
 */
export function applyOrderAdjustment(order, patch = {}) {
  const subtotal = order.subtotal ?? 0;
  const shippingFee = order.shippingFee ?? 0;

  const discount = patch.discount === undefined ? (order.discount ?? 0) : assertMoney(patch.discount, "Discount");
  if (discount > subtotal) {
    throw new Error(`Discount cannot exceed the ৳${subtotal} subtotal`);
  }

  const total = subtotal - discount + shippingFee;

  const amountPaid =
    patch.advanceReceived === undefined ? (order.amountPaid ?? 0) : assertMoney(patch.advanceReceived, "Advance received");
  if (amountPaid > total) {
    // Refusing beats silently clamping: a figure above the total means the
    // admin mistyped or the discount is wrong, and quietly absorbing it would
    // leave the order looking settled when it isn't.
    throw new Error(`Advance of ৳${amountPaid} is more than the ৳${total} order total`);
  }

  return { discount, total, amountPaid, amountDue: total - amountPaid };
}

/** Human-readable summary of what changed, for the order's own timeline.
 * Returns null when nothing actually moved, so a no-op save doesn't leave a
 * misleading "payment updated" entry in the history. */
export function describeAdjustment(before, after, reason) {
  const parts = [];
  const taka = (n) => `৳${Math.round(n).toLocaleString("en-IN")}`;
  if ((before.discount ?? 0) !== after.discount) {
    parts.push(`discount ${taka(before.discount ?? 0)} → ${taka(after.discount)}`);
  }
  if ((before.amountPaid ?? 0) !== after.amountPaid) {
    parts.push(`advance received ${taka(before.amountPaid ?? 0)} → ${taka(after.amountPaid)}`);
  }
  if ((before.total ?? 0) !== after.total) parts.push(`total ${taka(before.total ?? 0)} → ${taka(after.total)}`);
  if (!parts.length) return null;
  const summary = `Payment adjusted: ${parts.join(", ")}. Collect ${taka(after.amountDue)} on delivery`;
  return reason ? `${summary}. Reason: ${reason}` : summary;
}

/** Recalculates an order's money after products are ADDED to it.
 *
 * The sibling of applyOrderAdjustment above, and deliberately separate: that
 * one is explicit that it never touches `subtotal`, because an adjustment is
 * about money rather than about rewriting the basket. This one is the case
 * where the basket really did change, so subtotal is the one thing that moves.
 *
 * The same two invariants hold on the way out:
 *   total     === subtotal - discount + shippingFee
 *   amountDue === total - amountPaid
 *
 * `discount` is carried over untouched rather than recomputed. An order's
 * discount is snapshotted at checkout (order.model.js) and never re-derived
 * from the coupon — re-running a percentage coupon over a larger basket would
 * silently hand the customer a bigger discount than the one they were granted.
 * `amountPaid` is likewise untouched: money already received does not change
 * because more was ordered. The whole increase lands on amountDue, which is
 * what the rider collects.
 */
export function applyItemsAdded(order, addedSubtotal) {
  const added = assertMoney(addedSubtotal, "Added subtotal");
  if (added === 0) throw new Error("Nothing was added to the order");

  const subtotal = (order.subtotal ?? 0) + added;
  const discount = order.discount ?? 0;
  const shippingFee = order.shippingFee ?? 0;
  const amountPaid = order.amountPaid ?? 0;
  const total = subtotal - discount + shippingFee;

  return { subtotal, total, amountPaid, amountDue: total - amountPaid };
}

/** Timeline line for an item addition — what was added, and what it did to the
 * amount being collected at the door, which is the number the merchant acts on. */
export function describeItemsAdded(before, after, addedLines) {
  const taka = (n) => `৳${Math.round(n).toLocaleString("en-IN")}`;
  const what = addedLines.map((l) => `${l.qty}x ${l.title}`).join(", ");
  return (
    `Added ${what}. Subtotal ${taka(before.subtotal ?? 0)} → ${taka(after.subtotal)}, ` +
    `total ${taka(before.total ?? 0)} → ${taka(after.total)}. Collect ${taka(after.amountDue)} on delivery`
  );
}
