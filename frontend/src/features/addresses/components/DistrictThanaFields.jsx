import { useMemo } from "react";

import { BD_DISTRICTS, isThanaInDistrict, thanaOptionsForDistrict } from "@/lib/bdGeo";
import { SearchableSelect } from "@/components/shared/SearchableSelect";

const DISTRICT_OPTIONS = BD_DISTRICTS.map((d) => ({
  value: d.name,
  label: d.name,
  // Old spellings match while searching but never show: someone typing
  // "Chittagong" or "Jessore" still lands on Chattogram / Jashore.
  keywords: d.aka,
}));

/** The district → thana pair, shared by guest checkout and the saved-address
 * form so the dependency between them is implemented exactly once.
 *
 * Controlled on purpose: both callers drive react-hook-form state, and the
 * "changing district invalidates the thana" rule has to run on the same tick as
 * the district write, or the form can submit a thana from the previous district.
 *
 * @param FieldWrapper the caller's own label+error wrapper — the checkout and
 *   account forms use visually different ones with the same
 *   ({ label, error, children }) signature.
 */
export function DistrictThanaFields({ district, thana, onDistrictChange, onThanaChange, districtError, thanaError, FieldWrapper }) {
  // Options carry the courier's own name as the label, plus the official
  // spellings as hidden search keywords — so someone who types "Jatrabari" or
  // "Uttara East" still lands on Steadfast's "Jattrabari" / "Uttara".
  const thanaOptions = useMemo(() => thanaOptionsForDistrict(district), [district]);

  const handleDistrict = (next) => {
    onDistrictChange(next);
    // A thana only means anything inside its district. Keep it when the same
    // name exists in the new one (it generally won't), clear it otherwise —
    // silently shipping "Dhanmondi, Khulna" would be worse than re-asking.
    if (thana && !isThanaInDistrict(next, thana)) onThanaChange("");
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FieldWrapper label="District" error={districtError}>
        <SearchableSelect
          options={DISTRICT_OPTIONS}
          value={district ?? ""}
          onChange={handleDistrict}
          placeholder="Select district"
          searchPlaceholder="Search district…"
          emptyMessage="No district matches"
          invalid={Boolean(districtError)}
        />
      </FieldWrapper>

      <FieldWrapper label="Thana / Upazila" error={thanaError}>
        <SearchableSelect
          options={thanaOptions}
          value={thana ?? ""}
          onChange={onThanaChange}
          placeholder="Select thana"
          searchPlaceholder="Search thana…"
          emptyMessage="No thana matches"
          disabled={!thanaOptions.length}
          disabledHint="Select a district first"
          invalid={Boolean(thanaError)}
        />
      </FieldWrapper>
    </div>
  );
}
