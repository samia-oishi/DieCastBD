import { describe, it, expect } from "vitest";
import { reorderByIds } from "../../src/utils/reorderByIds.js";

/** A Model stand-in that records what bulkWrite was asked to do. */
function fakeModel(modifiedCount = 0) {
  const calls = [];
  return {
    calls,
    async bulkWrite(ops, options) {
      calls.push({ ops, options });
      return { modifiedCount };
    },
  };
}

describe("reorderByIds", () => {
  it("writes each id's position as its sortOrder, in one bulkWrite", async () => {
    const model = fakeModel(3);
    const moved = await reorderByIds(model, ["c", "a", "b"]);

    expect(moved).toBe(3);
    expect(model.calls).toHaveLength(1);
    expect(model.calls[0].ops).toEqual([
      { updateOne: { filter: { _id: "c" }, update: { $set: { sortOrder: 0 } } } },
      { updateOne: { filter: { _id: "a" }, update: { $set: { sortOrder: 1 } } } },
      { updateOne: { filter: { _id: "b" }, update: { $set: { sortOrder: 2 } } } },
    ]);
  });

  it("produces a dense sequence, so no two rows tie and sort by name instead", async () => {
    const model = fakeModel();
    await reorderByIds(model, ["a", "b", "c", "d"]);
    const orders = model.calls[0].ops.map((op) => op.updateOne.update.$set.sortOrder);
    expect(orders).toEqual([0, 1, 2, 3]);
  });

  it("does not touch the database for an empty list", async () => {
    const model = fakeModel();
    expect(await reorderByIds(model, [])).toBe(0);
    expect(model.calls).toHaveLength(0);
  });
});
