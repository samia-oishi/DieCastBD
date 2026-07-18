import { describe, it, expect } from "vitest";
import { subscriberIdParamSchema } from "../../src/modules/newsletter/newsletter.validation.js";

describe("subscriberIdParamSchema", () => {
  it("accepts a 24-char hex ObjectId", () => {
    const result = subscriberIdParamSchema.params.safeParse({ id: "507f1f77bcf86cd799439011" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-ObjectId id so Mongoose never sees a cast error", () => {
    const result = subscriberIdParamSchema.params.safeParse({ id: "not-an-id" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Invalid subscriber id");
  });

  it("rejects a hex string of the wrong length", () => {
    expect(subscriberIdParamSchema.params.safeParse({ id: "507f1f77bcf86cd7994390" }).success).toBe(false);
  });
});
