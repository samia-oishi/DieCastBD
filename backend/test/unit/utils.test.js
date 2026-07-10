import { describe, it, expect } from "vitest";
import { slugify } from "../../src/utils/slugify.js";
import { parseDurationMs } from "../../src/utils/parseDuration.js";
import { generateOrderNumber } from "../../src/utils/generateOrderNumber.js";

describe("slugify", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugify("HW Fast & Furious")).toBe("hw-fast-furious");
  });

  it("collapses runs of special characters into a single hyphen", () => {
    expect(slugify("MINI GT  #1022 — Silvia")).toBe("mini-gt-1022-silvia");
  });

  it("trims leading/trailing separators", () => {
    expect(slugify("  '70 Chevy Nova!  ")).toBe("70-chevy-nova");
  });
});

describe("parseDurationMs", () => {
  it("parses each supported unit", () => {
    expect(parseDurationMs("45s")).toBe(45_000);
    expect(parseDurationMs("15m")).toBe(900_000);
    expect(parseDurationMs("1h")).toBe(3_600_000);
    expect(parseDurationMs("30d")).toBe(2_592_000_000);
  });

  it("throws on an unrecognized format", () => {
    expect(() => parseDurationMs("10x")).toThrow(/invalid duration/i);
    expect(() => parseDurationMs("abc")).toThrow();
  });
});

describe("generateOrderNumber", () => {
  it("matches the DBD-YYYYMMDD-XXXXXX shape", () => {
    expect(generateOrderNumber()).toMatch(/^DBD-\d{8}-[0-9A-F]{6}$/);
  });

  it("embeds the given date", () => {
    expect(generateOrderNumber(new Date("2026-07-10T12:00:00Z"))).toMatch(/^DBD-20260710-/);
  });

  it("produces a distinct suffix each call (uniqueness)", () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(50);
  });
});
