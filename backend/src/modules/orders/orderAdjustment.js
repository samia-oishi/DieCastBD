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
