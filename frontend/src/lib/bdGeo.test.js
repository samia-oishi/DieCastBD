import { describe, it, expect } from "vitest";

import { BD_DISTRICTS, findDistrict, isThanaInDistrict, thanasForDistrict } from "./bdGeo";
import { formatAddressArea, formatAddressLine } from "./address";

describe("BD_DISTRICTS", () => {
  it("has all 64 districts, each with at least one thana", () => {
    expect(BD_DISTRICTS).toHaveLength(64);
    for (const d of BD_DISTRICTS) {
      expect(d.thanas.length, `${d.name} has no thanas`).toBeGreaterThan(0);
      expect(d.division).toBeTruthy();
    }
  });

  it("has no duplicate district names, and no duplicate thanas within a district", () => {
    expect(new Set(BD_DISTRICTS.map((d) => d.name)).size).toBe(64);
    for (const d of BD_DISTRICTS) {
      expect(new Set(d.thanas).size, `${d.name} repeats a thana`).toBe(d.thanas.length);
    }
  });

  it("covers Dhaka city — where most orders actually go", () => {
    const dhaka = thanasForDistrict("Dhaka");
    for (const t of ["Dhanmondi", "Gulshan", "Mohammadpur", "Banani", "Mirpur", "Uttara"]) {
      expect(dhaka, `Dhaka is missing ${t}`).toContain(t);
    }
    expect(dhaka).toContain("Savar"); // ...without losing the outlying upazilas
    // The official police names are reachable as aliases rather than as list
    // values, because the value stored is the one the courier expects.
    expect(dhaka).not.toContain("Mirpur Model");
    expect(isThanaInDistrict("Dhaka", "Mirpur Model")).toBe(true);
  });

  it("covers Chattogram city as well as its upazilas", () => {
    const ctg = thanasForDistrict("Chattogram");
    expect(ctg).toContain("Panchlaish");
    expect(ctg).toContain("Halishahar");
    expect(ctg).toContain("Sitakunda");
  });

  it("finds a place by its official spelling even though the courier spells it differently", () => {
    // The aliases exist so a customer never has to know the courier's spelling.
    expect(isThanaInDistrict("Dhaka", "Jatrabari")).toBe(true);   // -> "Jattrabari"
    expect(isThanaInDistrict("Dhaka", "Mirpur Model")).toBe(true); // -> "Mirpur"
    expect(isThanaInDistrict("Dhaka", "Uttara East")).toBe(true);  // -> "Uttara"
    expect(isThanaInDistrict("Chattogram", "Bayazid")).toBe(true); // -> "Bayazid Bostami"
  });

  it("never aliases one real place to a different real place", () => {
    // Edit distance proposed Gulistan<-Gulshan, Lama<-Ruma, Amtali<-Taltali and
    // Ramganj<-Ramgati. All are distinct places; an alias would misroute a parcel.
    const aliasesOf = (district, name) =>
      BD_DISTRICTS.find((d) => d.name === district)?.thanas.find((t) => t.n === name)?.a ?? [];
    expect(aliasesOf("Dhaka", "Gulistan")).not.toContain("Gulshan");
    expect(aliasesOf("Bandarban", "Lama")).not.toContain("Ruma");
    expect(aliasesOf("Barguna", "Amtali")).not.toContain("Taltali");
    expect(aliasesOf("Lakshmipur", "Ramganj")).not.toContain("Ramgati");
    expect(aliasesOf("Chandpur", "Matlab North")).not.toContain("Matlab South");
  });

  it("gives every district somewhere to deliver to", () => {
    for (const d of BD_DISTRICTS) expect(d.thanas.length, `${d.name} has no thanas`).toBeGreaterThan(0);
  });

  it("offers the courier's own zones, not just administrative thanas", () => {
    // The reason this list is Steadfast's: these are places they deliver to and
    // no upazila dataset contains, which is what the merchant reported missing.
    const dhaka = thanasForDistrict("Dhaka");
    for (const z of ["Bashundhara R/A", "Panthapath", "Gulistan", "Purbachal"]) {
      expect(dhaka, `Dhaka is missing courier zone ${z}`).toContain(z);
    }
  });

  it("drops Steadfast's catch-all row", () => {
    expect(BD_DISTRICTS.flatMap((d) => d.thanas.map((t) => t.n))).not.toContain("Zone Not Clear");
  });

  it("merges Dhaka City and Dhaka Sub-Urban into one Dhaka", () => {
    const dhaka = thanasForDistrict("Dhaka");
    expect(dhaka).toContain("Dhanmondi");   // Dhaka City
    expect(dhaka).toContain("Savar");       // Dhaka Sub-Urban
    expect(BD_DISTRICTS.filter((d) => /dhaka/i.test(d.name))).toHaveLength(1);
  });
});

describe("findDistrict", () => {
  it("matches regardless of case and punctuation", () => {
    expect(findDistrict("dhaka")?.name).toBe("Dhaka");
    expect(findDistrict("  COX'S BAZAR ")?.name).toBe("Cox's Bazar");
  });

  it("finds renamed districts under the spelling customers still type", () => {
    expect(findDistrict("Chittagong")?.name).toBe("Chattogram");
    expect(findDistrict("Jessore")?.name).toBe("Jashore");
    expect(findDistrict("Bogra")?.name).toBe("Bogura");
  });

  it("is undefined for an unknown name instead of throwing", () => {
    expect(findDistrict("Atlantis")).toBeUndefined();
    expect(findDistrict("")).toBeUndefined();
    expect(findDistrict(undefined)).toBeUndefined();
  });
});

describe("thanasForDistrict / isThanaInDistrict", () => {
  it("returns [] for an unknown district so callers can render without a null check", () => {
    expect(thanasForDistrict("Atlantis")).toEqual([]);
    expect(thanasForDistrict(undefined)).toEqual([]);
  });

  it("confirms membership case-insensitively", () => {
    expect(isThanaInDistrict("Dhaka", "mirpur model")).toBe(true);
    expect(isThanaInDistrict("Chittagong", "Panchlaish")).toBe(true); // via the alias
  });

  it("rejects a thana from a different district — the check that stops 'Dhanmondi, Khulna'", () => {
    expect(isThanaInDistrict("Khulna", "Dhanmondi")).toBe(false);
    expect(isThanaInDistrict("Dhaka", "")).toBe(false);
  });
});

describe("address formatting", () => {
  it("prints thana then district, and falls back to the legacy city + postcode", () => {
    expect(formatAddressArea({ thana: "Dhanmondi", district: "Dhaka" })).toBe("Dhanmondi, Dhaka");
    expect(formatAddressArea({ city: "Dhaka", district: "Dhaka", postalCode: "1207" })).toBe("Dhaka, Dhaka 1207");
    expect(formatAddressArea({})).toBe("");
  });

  it("joins the full line without stray commas when parts are missing", () => {
    expect(formatAddressLine({ addressLine1: "House 1, Road 2", thana: "Gulshan", district: "Dhaka" })).toBe(
      "House 1, Road 2, Gulshan, Dhaka"
    );
    expect(formatAddressLine({ addressLine1: "House 1" })).toBe("House 1");
    expect(formatAddressLine(null)).toBe("");
  });
});
