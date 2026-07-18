import { describe, it, expect } from "vitest";
import { updateSettingsSchema } from "../../src/modules/settings/settings.validation.js";

const parse = (seoDefaults) => updateSettingsSchema.body.safeParse({ seoDefaults });

describe("seoDefaults validation", () => {
  it("accepts the full new shape", () => {
    const result = parse({
      title: "T", description: "D",
      shareImage: { url: "https://res.cloudinary.com/x/share.png", cloudinaryId: "x" },
      googleSiteVerification: "abc123",
      returnWindowDays: "7",
    });
    expect(result.success).toBe(true);
    // Regression: returnWindowDays was `optionalNumber` passed BARE (it's a
    // schema factory), which made every settings save throw a 500.
    expect(result.data.seoDefaults.returnWindowDays).toBe(7);
  });

  it("treats a cleared return window as unset, not zero", () => {
    const result = parse({ returnWindowDays: "" });
    expect(result.success).toBe(true);
    expect(result.data.seoDefaults.returnWindowDays).toBeUndefined();
  });

  it("rejects a negative return window", () => {
    expect(parse({ returnWindowDays: -3 }).success).toBe(false);
  });

  it("allows clearing the share image with null", () => {
    expect(parse({ shareImage: null }).success).toBe(true);
  });
});
