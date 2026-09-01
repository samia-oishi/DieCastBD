import { describe, it, expect } from "vitest";

import { resolveZoneForDistrict } from "../../src/modules/settings/shippingZone.js";

const zones = [
  { name: "Inside Dhaka", fee: 70, requiresPrepay: false, districts: ["Dhaka City"], isDefault: false },
  { name: "Outside Dhaka", fee: 120, requiresPrepay: true, districts: [], isDefault: true },
];

describe("resolveZoneForDistrict", () => {
  it("puts a listed district in its own zone", () => {
    expect(resolveZoneForDistrict(zones, "Dhaka City").name).toBe("Inside Dhaka");
  });

  it("sends every unlisted district to the default zone", () => {
    for (const d of ["Chittagong", "Khulna", "Rangpur", "Dhaka Sub-Urban"]) {
      expect(resolveZoneForDistrict(zones, d).name, d).toBe("Outside Dhaka");
    }
  });

  it("matches regardless of case and punctuation", () => {
    expect(resolveZoneForDistrict(zones, "dhaka city").name).toBe("Inside Dhaka");
    expect(resolveZoneForDistrict(zones, "  DHAKA  CITY ").name).toBe("Inside Dhaka");
  });

  it("never string-matches the zone NAME — renaming a zone must not change routing", () => {
    // The trap this guards: "Inside Dhaka" renamed to "ঢাকার ভিতরে" or
    // "City delivery" must still take Dhaka City, because the mapping lives in
    // the districts list, not in the label.
    const renamed = [{ ...zones[0], name: "City delivery" }, { ...zones[1], name: "Everywhere else" }];
    expect(resolveZoneForDistrict(renamed, "Dhaka City").name).toBe("City delivery");
    expect(resolveZoneForDistrict(renamed, "Sylhet").name).toBe("Everywhere else");
  });

  it("falls back to the LAST zone when no default is marked", () => {
    // Guessing the cheaper zone would quietly undercharge every unlisted
    // district; the outside/expensive zone is conventionally listed last.
    const noDefault = zones.map((z) => ({ ...z, isDefault: false }));
    expect(resolveZoneForDistrict(noDefault, "Sylhet").name).toBe("Outside Dhaka");
  });

  it("handles a missing or empty district without throwing", () => {
    for (const d of [undefined, null, ""]) {
      expect(resolveZoneForDistrict(zones, d).name).toBe("Outside Dhaka");
    }
  });

  it("returns null when no zones are configured at all", () => {
    expect(resolveZoneForDistrict([], "Dhaka City")).toBeNull();
    expect(resolveZoneForDistrict(undefined, "Dhaka City")).toBeNull();
  });

  it("supports a third zone without any code change", () => {
    const three = [
      { name: "Inside Dhaka", fee: 70, districts: ["Dhaka City"] },
      { name: "Dhaka suburbs", fee: 100, districts: ["Dhaka Sub-Urban", "Gazipur", "Narayanganj"] },
      { name: "Outside Dhaka", fee: 150, districts: [], isDefault: true },
    ];
    expect(resolveZoneForDistrict(three, "Dhaka City").fee).toBe(70);
    expect(resolveZoneForDistrict(three, "Gazipur").fee).toBe(100);
    expect(resolveZoneForDistrict(three, "Barishal").fee).toBe(150);
  });
});
