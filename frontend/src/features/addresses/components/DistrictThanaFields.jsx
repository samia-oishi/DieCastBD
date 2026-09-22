import { useMemo } from "react";

import { BD_AREAS, areaValue, splitAreaValue } from "@/lib/bdGeo";
import { SearchableSelect } from "@/components/shared/SearchableSelect";

/** The delivery area: ONE search over every thana, with its district alongside.
 *
 * Steadfast's own parcel form works this way, and matching it is the point —
 * every address typed here is re-entered there, so the two should ask the same
 * question. Asking it once is also simply better: "which district is my thana
 * in?" is a question plenty of customers can't answer, and the courier splitting
 * the capital into Dhaka City / Dhaka Sub-Urban made it unanswerable for Dhaka.
 * Searching one list removes it — type "Dhanmondi" or "Savar" and the right
 * district comes attached.
 *
 * WHAT IS STORED IS UNCHANGED: district and thana, as two separate fields.
 * Shipping is priced per district and the courier payload needs both, so this
 * is a change to the question, not to the data. The props are unchanged too, so
 * guest checkout, the saved-address form and admin order creation keep working
 * without edits.
 *
 * @param FieldWrapper the caller's own label+error wrapper — the checkout and
 *   account forms use visually different ones with the same
 *   ({ label, error, children }) signature.
 */
export function DistrictThanaFields({ district, thana, onDistrictChange, onThanaChange, districtError, thanaError, FieldWrapper }) {
  const selected = areaValue(district, thana);

  // An address saved before this list existed — or from coverage Steadfast has
  // since dropped — must still show what it says rather than appear blank and
  // invite someone to "fix" a delivery address that was always correct.
  const options = useMemo(() => {
    if (!selected || BD_AREAS.some((a) => a.value === selected)) return BD_AREAS;
    return [{ value: selected, label: thana, hint: district, keywords: [district] }, ...BD_AREAS];
  }, [selected, district, thana]);

  const handleChange = (next) => {
    const picked = splitAreaValue(next);
    // Both writes happen on the same tick: the two fields are one answer, and a
    // form that saw the district change before the thana could submit a pairing
    // that never existed.
    onDistrictChange(picked.district);
    onThanaChange(picked.thana);
  };

  return (
    <FieldWrapper label="Area (thana, district)" error={districtError || thanaError}>
      <SearchableSelect
        options={options}
        value={selected}
        onChange={handleChange}
        placeholder="Select your area"
        searchPlaceholder="Search thana or district…"
        emptyMessage="No area matches — try the district name"
        invalid={Boolean(districtError || thanaError)}
      />
    </FieldWrapper>
  );
}
