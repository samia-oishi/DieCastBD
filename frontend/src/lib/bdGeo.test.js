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

  it("covers Dhaka city — the reason the metro thanas are merged in at all", () => {
    // The official upazila list for Dhaka district is only Savar, Dhamrai,
    // Keraniganj, Nawabganj and Dohar, so on that data alone none of these
    // (where most orders actually go) would be selectable.
    const dhaka = thanasForDistrict("Dhaka");
    for (const t of ["Dhanmondi", "Gulshan", "Uttara East", "Mirpur Model", "Mohammadpur", "Banani"]) {
      expect(dhaka, `Dhaka is missing ${t}`).toContain(t);
    }
    expect(dhaka).toContain("Savar"); // ...without losing the real upazilas
  });

  it("covers Chattogram city as well as its upazilas", () => {
    const ctg = thanasForDistrict("Chattogram");
    expect(ctg).toContain("Panchlaish");
    expect(ctg).toContain("Halishahar");
    expect(ctg).toContain("Sitakunda");
  });

  // Khulna and Rajshahi are the regression this guards: on official upazila
  // data alone neither district had ANY entry for its own city, so customers in
  // the 3rd and 4th largest cities in the country could not say where they live.
  it.each([
    ["Khulna", ["Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur"], "Dumuria"],
    ["Rajshahi", ["Boalia", "Rajpara", "Motihar", "Shah Makhdum"], "Godagari"],
    ["Sylhet", ["Kotwali Model", "Jalalabad", "South Surma"], "Beanibazar"],
    ["Gazipur", ["Joydebpur", "Tongi East", "Tongi West", "Kashimpur"], "Kaliakair"],
    ["Barisal", ["Kotwali Model", "Kawnia", "Bandar"], "Gournadi"],
    ["Rangpur", ["Kotwali", "Tajhat", "Mahiganj"], "Mithapukur"],
  ])("covers %s city (metro thanas) without losing its upazilas", (district, metro, upazila) => {
    const list = thanasForDistrict(district);
    for (const t of metro) expect(list, `${district} is missing ${t}`).toContain(t);
    expect(list, `${district} lost upazila ${upazila}`).toContain(upazila);
  });

  it("gives every district somewhere to deliver to", () => {
    for (const d of BD_DISTRICTS) expect(d.thanas.length, `${d.name} has no thanas`).toBeGreaterThan(0);
  });

  it("names each Sadar after its own district, so searching the district finds it", () => {
    // "Bogra Sadar" under a district displayed as "Bogura" was unfindable by
    // anyone typing the name they had just picked.
    expect(thanasForDistrict("Bogura")).toContain("Bogura Sadar");
    expect(thanasForDistrict("Jashore")).toContain("Jashore Sadar");
  });

  it("offers no station that does not exist yet", () => {
    // Barisal Metropolitan Police has four approved-but-unbuilt stations.
    for (const t of ["Rupatali", "Barisal University", "Char Monai", "Kashipur"]) {
      expect(thanasForDistrict("Barisal")).not.toContain(t);
    }
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
