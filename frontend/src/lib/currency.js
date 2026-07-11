// Indian-style digit grouping, per README §Design Tokens ("Currency: ৳ +
// Indian-style grouping, toLocaleString('en-IN')").
export function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-IN")}`;
}
