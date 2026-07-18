/**
 * THE single source of truth for what a product actually sells for.
 *
 * A `salePrice` only counts when it is a REAL discount: greater than zero and
 * below the list price. Both halves matter:
 *   - `> 0`   — a stale/blank sale price stored as 0 must never make an item free.
 *              (`salePrice ?? price` and `salePrice != null` both let 0 through:
 *              `0 ?? 200 === 0`, and `0 != null` is true.)
 *   - `< price` — a "sale" at or above list isn't a discount.
 *
 * Every price shown, charged, or used for margin must come from here — this rule
 * was previously copy-pasted (and subtly wrong) across the model, cart, orders
 * and emails, which is exactly how two live products ended up sellable at ৳0.
 */
export function effectivePrice(product) {
  if (!product) return 0;
  const { price = 0, salePrice } = product;
  return isOnSale(product) ? salePrice : price;
}

/** True when the product has a genuine, active discount. */
export function isOnSale(product) {
  if (!product) return false;
  const { price = 0, salePrice } = product;
  return salePrice != null && salePrice > 0 && salePrice < price;
}
