/** The "area" line of a shipping address — "Dhanmondi, Dhaka".
 *
 * Checkout collects a district and a thana from dropdowns. Orders placed before
 * that change carry a free-text `city` (and often a postcode) and no `thana`,
 * so both shapes are read here and every surface prints one line without
 * knowing which era an order came from.
 *
 * Returns "" when the address has neither — callers should treat that as "omit
 * the line" rather than printing an empty comma-separated husk.
 */
export function formatAddressArea(address) {
  if (!address) return "";
  const area = [address.thana || address.city, address.district].filter(Boolean).join(", ");
  return address.postalCode ? `${area} ${address.postalCode}`.trim() : area;
}
