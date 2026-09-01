import { describe, it, expect } from "vitest";

import { BD_DISTRICTS, findDistrict, isThanaInDistrict, thanasForDistrict } from "./bdGeo";
import { formatAddressArea, formatAddressLine } from "./address";

describe("BD_DISTRICTS", () => {
  it("has all 64 districts, each with at least one thana", () => {
    // 65, not 64: Steadfast splits the capital into Dhaka City / Dhaka Sub-Urban
    // and this list mirrors theirs exactly so the merchant never translates.
    expect(BD_DISTRICTS).toHaveLength(65);
    for (const d of BD_DISTRICTS) {
      expect(d.thanas.length, `${d.name} has no thanas`).toBeGreaterThan(0);
    }
  });

  it("has no duplicate district names, and no duplicate thanas within a district", () => {
    expect(new Set(BD_DISTRICTS.map((d) => d.name)).size).toBe(65);
    for (const d of BD_DISTRICTS) {
      expect(new Set(d.thanas).size, `${d.name} repeats a thana`).toBe(d.thanas.length);
    }
  });

  it("covers Dhaka city — where most orders actually go", () => {
    const dhaka = thanasForDistrict("Dhaka City");
    for (const t of ["Dhanmondi", "Gulshan", "Mohammadpur", "Banani", "Mirpur", "Uttara", "Bashundhara R/A"]) {
      expect(dhaka, `Dhaka City is missing ${t}`).toContain(t);
    }
    expect(thanasForDistrict("Dhaka Sub-Urban")).toContain("Savar");
    expect(isThanaInDistrict("Dhaka City", "Mirpur Model")).toBe(true);  // official spelling as alias
  });

  it("covers Chattogram city as well as its upazilas", () => {
    const ctg = thanasForDistrict("Chittagong");
    expect(ctg).toContain("Panchlaish");
    expect(ctg).toContain("Halishahar");
    expect(ctg).toContain("Sitakunda");
  });

  it("finds a place by its official spelling even though the courier spells it differently", () => {
    // The aliases exist so a customer never has to know the courier's spelling.
    expect(isThanaInDistrict("Dhaka City", "Jatrabari")).toBe(true);   // -> "Jattrabari"
    expect(isThanaInDistrict("Dhaka City", "Mirpur Model")).toBe(true); // -> "Mirpur"
    expect(isThanaInDistrict("Dhaka City", "Uttara East")).toBe(true);  // -> "Uttara"
    expect(isThanaInDistrict("Chittagong", "Bayazid")).toBe(true); // -> "Bayazid Bostami"
  });

  it("never aliases one real place to a different real place", () => {
    // Edit distance proposed Gulistan<-Gulshan, Lama<-Ruma, Amtali<-Taltali and
    // Ramganj<-Ramgati. All are distinct places; an alias would misroute a parcel.
    const aliasesOf = (district, name) =>
      BD_DISTRICTS.find((d) => d.name === district)?.thanas.find((t) => t.n === name)?.a ?? [];
    expect(aliasesOf("Dhaka City", "Gulistan")).not.toContain("Gulshan");
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
    const dhaka = thanasForDistrict("Dhaka City");
    for (const z of ["Bashundhara R/A", "Panthapath", "Gulistan", "Purbachal"]) {
      expect(dhaka, `Dhaka is missing courier zone ${z}`).toContain(z);
    }
  });

  it("drops Steadfast's catch-all row", () => {
    expect(BD_DISTRICTS.flatMap((d) => d.thanas.map((t) => t.n))).not.toContain("Zone Not Clear");
  });

  it("keeps Steadfast's Dhaka split, but lets either half be found by typing Dhaka or a zone", () => {
    expect(BD_DISTRICTS.filter((d) => /dhaka/i.test(d.name)).map((d) => d.name))
      .toEqual(["Dhaka City", "Dhaka Sub-Urban"]);
    // A customer should never need to know which half they live in.
    const akaOf = (n) => BD_DISTRICTS.find((d) => d.name === n).aka;
    expect(akaOf("Dhaka City")).toContain("Dhaka");
    expect(akaOf("Dhaka Sub-Urban")).toContain("Dhaka");
    expect(akaOf("Dhaka Sub-Urban")).toContain("Savar");     // type Savar -> Sub-Urban
    expect(akaOf("Dhaka City")).toContain("Dhanmondi");      // type Dhanmondi -> City
  });

  it("uses Steadfast's district spellings, with the modern ones still searchable", () => {
    for (const n of ["Chittagong", "Bogra", "Cumilla", "Barishal"]) {
      expect(BD_DISTRICTS.map((d) => d.name)).toContain(n);
    }
    expect(findDistrict("Chattogram")?.name).toBe("Chittagong");
    expect(findDistrict("Bogura")?.name).toBe("Bogra");
    // A plain "Dhaka" from an order placed before the split must land on the
    // half that holds 58 of the 66 zones, not the 8-zone one.
    expect(findDistrict("Dhaka")?.name).toBe("Dhaka City");
  });
});

describe("findDistrict", () => {
  it("matches regardless of case and punctuation", () => {
    expect(findDistrict("dhaka")?.name).toBe("Dhaka City");
    expect(findDistrict("  COX'S BAZAR ")?.name).toBe("Cox's Bazar");
  });

  it("resolves the modern spelling onto the courier's, which is what gets stored", () => {
    // The direction is deliberate: Steadfast's name is canonical so the merchant
    // never translates, and the name customers know is the searchable alias.
    expect(findDistrict("Chattogram")?.name).toBe("Chittagong");
    expect(findDistrict("Jashore")?.name).toBe("Jashore");   // same in both
    expect(findDistrict("Bogura")?.name).toBe("Bogra");
    expect(findDistrict("Cumilla")?.name).toBe("Cumilla");
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
