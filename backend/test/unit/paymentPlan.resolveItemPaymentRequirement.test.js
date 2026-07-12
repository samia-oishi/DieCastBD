import { describe, it, expect } from "vitest";
import { resolveItemPaymentRequirement } from "../../src/modules/orders/paymentPlan.service.js";

// Pure per-product payment-option resolution — shared by admin display, cart
// preview, and (from Phase 4) order creation, so it gets table-driven
// coverage ahead of being wired into the checkout path.
describe("resolveItemPaymentRequirement", () => {
  it("defaults to cod+full when a product has no paymentOptions set", () => {
    const result = resolveItemPaymentRequirement({});
    expect(result).toEqual({
      allowsCod: true,
      allowsDeliveryOnly: false,
      allowsFull: true,
      requiresAdvance: false,
      advancePercent: null,
    });
  });

  it("defaults to cod+full when paymentOptions is an empty array", () => {
    const result = resolveItemPaymentRequirement({ paymentOptions: [] });
    expect(result.allowsCod).toBe(true);
    expect(result.allowsFull).toBe(true);
  });

  it("reflects a cod-only product", () => {
    const result = resolveItemPaymentRequirement({ paymentOptions: ["cod"] });
    expect(result).toEqual({
      allowsCod: true,
      allowsDeliveryOnly: false,
      allowsFull: false,
      requiresAdvance: false,
      advancePercent: null,
    });
  });

  it("reflects a deliveryOnly product", () => {
    const result = resolveItemPaymentRequirement({ paymentOptions: ["deliveryOnly"] });
    expect(result.allowsDeliveryOnly).toBe(true);
    expect(result.allowsCod).toBe(false);
    expect(result.requiresAdvance).toBe(false);
  });

  it("surfaces the advance percent for a partialAdvance product", () => {
    const result = resolveItemPaymentRequirement({ paymentOptions: ["partialAdvance", "full"], advancePaymentPercent: 20 });
    expect(result.requiresAdvance).toBe(true);
    expect(result.advancePercent).toBe(20);
    expect(result.allowsCod).toBe(false);
    expect(result.allowsFull).toBe(true);
  });

  it("nulls out advancePercent when partialAdvance isn't selected, even if the field is stale", () => {
    // Guards against a product that once had partialAdvance + a percent, then
    // was switched back to cod/full without clearing advancePaymentPercent.
    const result = resolveItemPaymentRequirement({ paymentOptions: ["cod", "full"], advancePaymentPercent: 20 });
    expect(result.requiresAdvance).toBe(false);
    expect(result.advancePercent).toBeNull();
  });

  it("handles a product allowing all four options", () => {
    const result = resolveItemPaymentRequirement({
      paymentOptions: ["deliveryOnly", "partialAdvance", "full"],
      advancePaymentPercent: 10,
    });
    expect(result).toEqual({
      allowsCod: false,
      allowsDeliveryOnly: true,
      allowsFull: true,
      requiresAdvance: true,
      advancePercent: 10,
    });
  });
});
