/** Picks the delivery zone for an address.
 *
 * Checkout used to ask the customer to choose "Inside Dhaka" or "Outside
 * Dhaka" themselves, which is a question they can answer wrongly and one more
 * tap on a phone. Now that the address carries the courier's own district
 * (plan.md #96), the zone can simply be derived from it.
 *
 * Pure and settings-driven on purpose. It never looks for the word "Dhaka":
 * zone names are admin-renamable free text, so the mapping lives in each zone's
 * own `districts` list and one zone carries `isDefault` for everywhere else.
 * Hardcoding a name here would break the first time a zone is renamed — the
 * same trap `requiresPrepay` was created to avoid.
 */
const key = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function resolveZoneForDistrict(zones = [], district) {
  if (!zones.length) return null;

  const k = key(district);
  if (k) {
    const listed = zones.find((z) => (z.districts ?? []).some((d) => key(d) === k));
    if (listed) return listed;
  }

  // Everywhere else. Falls back to the last zone when the merchant hasn't
  // marked one — the outside/expensive zone is conventionally listed last, and
  // guessing the cheaper one would quietly undercharge every unlisted district.
  return zones.find((z) => z.isDefault) ?? zones[zones.length - 1] ?? null;
}
