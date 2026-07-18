import { describe, it, expect } from "vitest";
import { idParamSchema, updatePageSchema, createPageSchema } from "../../src/modules/pages/page.validation.js";

describe("page id params", () => {
  it("accepts a real ObjectId", () => {
    expect(idParamSchema.params.safeParse({ id: "507f1f77bcf86cd799439011" }).success).toBe(true);
  });

  // Regression: these used to be z.string().min(1), so "nope" reached Mongoose
  // and threw a CastError, surfacing to the client as a 500 instead of a 400.
  it("rejects a non-ObjectId id rather than letting Mongoose throw a 500", () => {
    expect(idParamSchema.params.safeParse({ id: "nope" }).success).toBe(false);
  });

  it("guards the update route's params the same way", () => {
    expect(updatePageSchema.params.safeParse({ id: "nope" }).success).toBe(false);
    expect(updatePageSchema.params.safeParse({ id: "507f1f77bcf86cd799439011" }).success).toBe(true);
  });
});

describe("page create body", () => {
  it("requires a title", () => {
    expect(createPageSchema.body.safeParse({}).success).toBe(false);
  });

  it("accepts a page with blocks", () => {
    const result = createPageSchema.body.safeParse({
      title: "Eid Sale",
      blocks: [{ type: "heading", text: "Hi", level: "H1" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a block that fails block validation", () => {
    const result = createPageSchema.body.safeParse({
      title: "Eid Sale",
      blocks: [{ type: "button", text: "x", link: "javascript:alert(1)" }],
    });
    expect(result.success).toBe(false);
  });
});
