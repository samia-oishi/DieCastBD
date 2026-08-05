/** The "area" line of an address — "Dhanmondi, Dhaka".
 *
 * Mirrors backend/src/utils/address.js, which formats the same line for the
 * order emails. Checkout collects a district and a thana from dropdowns;
 * addresses and orders saved before that carry a free-text `city` (and often a
 * postcode) instead, so both shapes are read here and no display site has to
 * know which era its record came from.
 *
 * Returns "" when there is neither — render the line conditionally on that.
 */
export function formatAddressArea(address) {
  if (!address) return "";
  const area = [address.thana || address.city, address.district].filter(Boolean).join(", ");
  return address.postalCode ? `${area} ${address.postalCode}`.trim() : area;
}

/** Full address as one string: "12 Road 3, Dhanmondi, Dhaka". */
export function formatAddressLine(address) {
  if (!address) return "";
  return [address.addressLine1, address.addressLine2, formatAddressArea(address)].filter(Boolean).join(", ");
}
