import { describe, it, expect } from "vitest";

import {
  buildCreateOrderPayload,
  buildRecipientAddress,
  courierBlockReason,
  isTerminal,
  normalizeBdPhone,
} from "../../src/modules/courier/steadfast.payload.js";

const order = (over = {}) => ({
  orderNumber: "DBD-20260901-5268B3",
  status: "confirmed",
  phone: "01712345678",
  total: 2030,
  amountPaid: 0,
  amountDue: 2030,
  shippingAddress: {
    recipientName: "Samia Alam",
    phone: "01712345678",
    addressLine1: "House 12, Road 3",
    thana: "Dhanmondi",
    district: "Dhaka City",
  },
  ...over,
});

describe("cod_amount — what the courier collects at the door", () => {
  it("is the amount still DUE, not the order total", () => {
    // The whole risk of this feature. A partly-prepaid order that sends `total`
    // makes the courier charge the customer again for money already paid.
    const partlyPaid = order({ total: 2030, amountPaid: 70, amountDue: 1960 });
    expect(buildCreateOrderPayload(partlyPaid).cod_amount).toBe(1960);
    expect(buildCreateOrderPayload(partlyPaid).cod_amount).not.toBe(partlyPaid.total);
  });

  it("is 0 for a fully prepaid order, so nothing is collected", () => {
    expect(buildCreateOrderPayload(order({ amountPaid: 2030, amountDue: 0 })).cod_amount).toBe(0);
  });

  it("is the full total for a plain cash-on-delivery order", () => {
    expect(buildCreateOrderPayload(order()).cod_amount).toBe(2030);
  });

  it("never goes negative, and is always a whole taka", () => {
    expect(buildCreateOrderPayload(order({ amountDue: -5 })).cod_amount).toBe(0);
    expect(buildCreateOrderPayload(order({ amountDue: 1959.6 })).cod_amount).toBe(1960);
  });
});

describe("normalizeBdPhone", () => {
  it.each([
    ["01712345678", "01712345678"],
    ["+8801712345678", "01712345678"],
    ["8801712345678", "01712345678"],
    ["01712-345678", "01712345678"],
    ["  017 1234 5678 ", "01712345678"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeBdPhone(input)).toBe(expected);
  });

  it.each([
    ["0171234567"],      // 10 digits
    ["017123456789"],    // 12 digits
    ["01212345678"],     // no such operator prefix
    ["1712345678"],      // missing leading 0
    [""],
    [null],
    [undefined],
  ])("rejects %s rather than shipping an undeliverable parcel", (input) => {
    expect(normalizeBdPhone(input)).toBeNull();
  });
});

describe("buildRecipientAddress", () => {
  it("joins the line with the district and thana", () => {
    expect(buildRecipientAddress(order().shippingAddress)).toBe("House 12, Road 3, Dhanmondi, Dhaka City");
  });

  it("stays within Steadfast's 250-character limit", () => {
    const long = { addressLine1: "A".repeat(400), thana: "Dhanmondi", district: "Dhaka City" };
    expect(buildRecipientAddress(long).length).toBeLessThanOrEqual(250);
  });

  it("cuts on a word boundary when it can, so a truncated address still reads", () => {
    const words = { addressLine1: Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ") };
    const out = buildRecipientAddress(words);
    expect(out.length).toBeLessThanOrEqual(250);
    // Ends on a whole word, not mid-token like "wor" — the courier has to read this.
    expect(out).toMatch(/word\d+$/);
    expect(words.addressLine1.startsWith(out)).toBe(true);
  });

  it("still produces a line for an order placed before the district/thana dropdowns", () => {
    expect(buildRecipientAddress({ addressLine1: "Old House", city: "Dhaka", postalCode: "1207" }))
      .toBe("Old House, Dhaka 1207");
  });
});

describe("courierBlockReason — the guards that stop a bad or duplicate parcel", () => {
  it("blocks an order already sent, naming the consignment", () => {
    const sent = order({ courier: { consignmentId: "1424107" } });
    expect(courierBlockReason(sent)).toMatch(/1424107/);
    expect(() => buildCreateOrderPayload(sent)).toThrow(/1424107/);
  });

  it.each(["cancelled", "refunded"])("blocks a %s order", (status) => {
    expect(courierBlockReason(order({ status }))).toMatch(status);
  });

  it("blocks an unusable phone number", () => {
    const bad = order({ shippingAddress: { ...order().shippingAddress, phone: "0171234" } });
    expect(courierBlockReason(bad)).toMatch(/not a valid 11-digit/);
  });

  it("blocks an order with no address", () => {
    expect(courierBlockReason(order({ shippingAddress: {} }))).toMatch(/no shipping address/);
  });

  it("allows a normal confirmed order", () => {
    expect(courierBlockReason(order())).toBeNull();
  });
});

describe("payload shape", () => {
  it("sends the order number as the unique invoice and respects field limits", () => {
    const p = buildCreateOrderPayload(order({ shippingAddress: { ...order().shippingAddress, recipientName: "N".repeat(200) } }));
    expect(p.invoice).toBe("DBD-20260901-5268B3");
    expect(p.recipient_name).toHaveLength(100);
    expect(p.recipient_phone).toBe("01712345678");
  });

  it("includes the delivery note only when there is one", () => {
    expect(buildCreateOrderPayload(order())).not.toHaveProperty("note");
    expect(buildCreateOrderPayload(order({ deliveryNote: "Call first" })).note).toBe("Call first");
  });
});

describe("isTerminal — which parcels are worth re-polling", () => {
  it.each(["delivered", "partial_delivered", "cancelled"])("%s is finished", (s) => expect(isTerminal(s)).toBe(true));
  it.each(["pending", "in_review", "hold", "unknown", "delivered_approval_pending", "cancelled_approval_pending"])(
    "%s is still moving",
    (s) => expect(isTerminal(s)).toBe(false)
  );
});
