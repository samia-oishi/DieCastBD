/**
 * THE single source of truth for what a product actually sells for (mirrors
 * backend/src/utils/pricing.js — keep the two in step).
 *
 * A `salePrice` only counts when it is a REAL discount: greater than zero and
 * below the list price. Both halves matter:
 *   - `> 0`   — a stale/blank sale price stored as 0 must never make an item free.
 *              (`salePrice ?? price` and `salePrice != null` both let 0 through:
 *              `0 ?? 200 === 0`, and `0 != null` is true.)
 *   - `< price` — a "sale" at or above list isn't a discount.
 *
 * Every displayed price, cart total and checkout preview must come from here.
 */
export function effectivePrice(product) {
  if (!product) return 0;
  const { price = 0, salePrice } = product;
  return isOnSale(product) ? salePrice : price;
}

/** True when the product has a genuine, active discount (drives strikethroughs). */
export function isOnSale(product) {
  if (!product) return false;
  const { price = 0, salePrice } = product;
  return salePrice != null && salePrice > 0 && salePrice < price;
}

/** How much a shopper saves versus the regular price, or 0 when not on sale.
 *
 * Shown as a cash amount rather than a percentage everywhere. On this
 * catalogue the difference is stark: ৳100 off a ৳2,790 five-pack is a
 * shrug-worthy "4% off" but a concrete "Save ৳100". Cash also stays
 * comparable across products, where mixed framings ("4% off" here, "Save ৳260"
 * there) force the shopper to do arithmetic to compare two cards.
 */
export function savingsAmount(product) {
  if (!isOnSale(product)) return 0;
  return product.price - product.salePrice;
}
