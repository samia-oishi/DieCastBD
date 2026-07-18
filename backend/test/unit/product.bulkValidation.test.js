import { describe, it, expect } from "vitest";
import { bulkStatusSchema, bulkDeleteSchema } from "../../src/modules/products/product.validation.js";

// The admin Products list can bulk set-status / delete. These schemas are the
// guard on the ids array + status enum; validate() rejects on a failed parse.
const oid = () => "6a4fc39aca3c4b16ec545d68";

describe("bulkStatusSchema", () => {
  it("accepts a valid id list with active/draft", () => {
    for (const status of ["active", "draft"]) {
      expect(bulkStatusSchema.body.safeParse({ ids: [oid()], status }).success).toBe(true);
    }
  });

  it("rejects a status outside active/draft (archived stays a per-product edit)", () => {
    expect(bulkStatusSchema.body.safeParse({ ids: [oid()], status: "archived" }).success).toBe(false);
  });

  it("rejects a malformed id, an empty list, and > 100 ids", () => {
    expect(bulkStatusSchema.body.safeParse({ ids: ["nope"], status: "active" }).success).toBe(false);
    expect(bulkStatusSchema.body.safeParse({ ids: [], status: "active" }).success).toBe(false);
    expect(bulkStatusSchema.body.safeParse({ ids: Array(101).fill(oid()), status: "active" }).success).toBe(false);
  });
});

describe("bulkDeleteSchema", () => {
  it("accepts a valid id list", () => {
    expect(bulkDeleteSchema.body.safeParse({ ids: [oid(), oid()] }).success).toBe(true);
  });

  it("rejects empty / malformed / oversized", () => {
    expect(bulkDeleteSchema.body.safeParse({ ids: [] }).success).toBe(false);
    expect(bulkDeleteSchema.body.safeParse({ ids: ["x"] }).success).toBe(false);
    expect(bulkDeleteSchema.body.safeParse({ ids: Array(101).fill(oid()) }).success).toBe(false);
  });
});
