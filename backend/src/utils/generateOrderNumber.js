import { randomBytes } from "node:crypto";

/** e.g. "DBD-20260709-K7QX" — date-prefixed for readability, random suffix for uniqueness. */
export function generateOrderNumber(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `DBD-${datePart}-${suffix}`;
}
