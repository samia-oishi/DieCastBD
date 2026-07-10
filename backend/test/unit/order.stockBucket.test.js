import { describe, it, expect } from "vitest";
import { stockBucket } from "../../src/modules/orders/order.service.js";

// stockBucket's classification drives every branch of transitionOrderStatus's
// stock-effect state machine — a misclassification here means silently wrong
// inventory math on some status transition, so it gets its own direct coverage
// independent of the DB-backed transition logic (curl-verified separately).
describe("stockBucket", () => {
  it("classifies pending as reserved", () => {
    expect(stockBucket("pending")).toBe("reserved");
  });

  it("classifies confirmed/packed/shipped/delivered as committed", () => {
    expect(stockBucket("confirmed")).toBe("committed");
    expect(stockBucket("packed")).toBe("committed");
    expect(stockBucket("shipped")).toBe("committed");
    expect(stockBucket("delivered")).toBe("committed");
  });

  it("classifies cancelled/refunded as released", () => {
    expect(stockBucket("cancelled")).toBe("released");
    expect(stockBucket("refunded")).toBe("released");
  });
});
