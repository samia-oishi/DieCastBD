import { describe, it, expect } from "vitest";

import { formatAddressArea } from "../../src/utils/address.js";

describe("formatAddressArea", () => {
  it("prints thana then district for addresses from the dropdown checkout", () => {
    expect(formatAddressArea({ thana: "Dhanmondi", district: "Dhaka" })).toBe("Dhanmondi, Dhaka");
  });

  it("falls back to the legacy free-text city, including its postcode", () => {
    expect(formatAddressArea({ city: "Dhaka", district: "Dhaka", postalCode: "1207" })).toBe("Dhaka, Dhaka 1207");
  });

  it("prefers thana when a record carries both", () => {
    expect(formatAddressArea({ thana: "Gulshan", city: "Dhaka", district: "Dhaka" })).toBe("Gulshan, Dhaka");
  });

  it("returns an empty string rather than stray punctuation when there is nothing to print", () => {
    expect(formatAddressArea({})).toBe("");
    expect(formatAddressArea(null)).toBe("");
    expect(formatAddressArea(undefined)).toBe("");
  });

  it("omits the separator when only one part is known", () => {
    expect(formatAddressArea({ district: "Khulna" })).toBe("Khulna");
    expect(formatAddressArea({ thana: "Savar" })).toBe("Savar");
  });
});
