/** Which delivery zone an address falls into.
 *
 * Checkout used to ask the customer to pick "Inside Dhaka" or "Outside Dhaka"
 * themselves, one tap after they had already told us their district — a
 * question they could get wrong, and the answer decided the fee. Now the
 * district decides it.
 *
 * The mapping lives in the ZONE (settings.shippingZones[].districts), never in
 * a string match on the zone's name: zone names are admin-renamable free text,
 * so matching on "Dhaka" would break silently the day a zone is renamed.
 *
 * Deliberately mirrors backend/src/modules/settings/shippingZone.js — the
 * server re-derives the zone from the saved address and ignores whatever the
 * client sent, so this copy only ever drives the preview. If the two ever
 * disagree, the server wins and the customer sees the server's fee on the
 * order. Both are covered by the same set of cases in their unit tests.
 */

const key = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function resolveZoneForDistrict(zones = [], district) {
  if (!zones?.length) return null;
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
