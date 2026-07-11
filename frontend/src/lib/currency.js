/** Single source for money formatting: ৳ + Indian-style digit grouping
 * (`toLocaleString('en-IN')`) per the design tokens. Never format prices
 * inline — always call this so grouping/symbol stay consistent across the app. */
export function formatTaka(amount) {
  return `৳${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;
}
