/** Per-product payment-option resolution — shared math so a product's payment
 * rules can never drift between admin display, cart/checkout preview, and
 * order creation, mirroring the coupon.service.js shared-math pattern.
 * Pure and synchronous: reads only the product's own paymentOptions/
 * advancePaymentPercent fields, no DB access.
 *
 * Created in Phase 2 and unit-tested in isolation; inert until Phase 4 wires
 * assertPaymentMethodAllowed/calculateAmountPaid into buildAndSaveOrder ahead
 * of the higher-risk checkout-enforcement integration.
 */
export function resolveItemPaymentRequirement(product) {
  const options = product?.paymentOptions?.length ? product.paymentOptions : ["cod", "full"];
  const requiresAdvance = options.includes("partialAdvance");
  return {
    allowsCod: options.includes("cod"),
    allowsDeliveryOnly: options.includes("deliveryOnly"),
    allowsFull: options.includes("full"),
    requiresAdvance,
    advancePercent: requiresAdvance ? (product?.advancePaymentPercent ?? null) : null,
  };
}
