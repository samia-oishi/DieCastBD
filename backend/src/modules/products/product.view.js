import { effectivePrice } from "../../utils/pricing.js";

/** Fields a public product card needs.
 *
 * `ProductCard` on the storefront reads slug/title/brand/price/salePrice/
 * thumbnail/gallery/isNewArrival plus the availableStock and isPreOrderActive
 * virtuals — and the virtuals in turn need stock/reservedStock/isPreOrder/
 * preOrderEndDate. Dropping any of them doesn't error, it just renders a
 * subtly wrong card, which is the worst kind of bug to catch.
 */
export const PUBLIC_CARD_FIELDS =
  "slug title brand price salePrice thumbnail gallery isNewArrival isFeatured stock reservedStock isPreOrder preOrderEndDate";

/** Recomputes the model's virtuals on a `.lean()` document.
 *
 * Mongoose has no built-in "lean + virtuals" (that needs the separate
 * mongoose-lean-virtuals plugin, not installed here), so every public read that
 * leans for the hydration savings must recompute these by hand. Mirrors
 * product.model.js's availableStock / profitMargin / isPreOrderActive getters
 * exactly — keep in sync if those change.
 *
 * This lives in its own module because it had already been hand-copied once:
 * the Pages block resolver leaned without it, so `availableStock` came back
 * undefined and `undefined <= 0` is false — an out-of-stock product rendered as
 * buyable, with an add-to-cart button.
 *
 * costPrice is select:false and never re-selected on public routes, so
 * profitMargin always resolves to null there.
 */
export function withComputedVirtuals(p) {
  p.availableStock = p.stock - p.reservedStock;
  if (p.costPrice == null || !p.price) {
    p.profitMargin = null;
  } else {
    const effective = effectivePrice(p);
    p.profitMargin = effective ? Math.round(((effective - p.costPrice) / effective) * 100) : null;
  }
  p.isPreOrderActive = Boolean(p.isPreOrder) && (!p.preOrderEndDate || p.preOrderEndDate >= new Date());
  return p;
}
