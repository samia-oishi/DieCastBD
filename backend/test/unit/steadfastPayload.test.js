import { describe, it, expect } from "vitest";

import { buildCreateOrderPayload, buildRecipientAddress, courierBlockReason, isTerminal, normalizeBdPhone, FRAGILE_NOTE, buildItemDescription, buildNote } from "../../src/modules/courier/steadfast.payload.js";

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
    // Hyphenated since 2026-09-05: Steadfast's own documented example address
    // is "Dhanmondi, Dhaka-1209", and their portal parses this string to fill
    // its District/Thana dropdowns, so we match their format exactly.
    expect(buildRecipientAddress({ addressLine1: "Old House", city: "Dhaka", postalCode: "1207" }))
      .toBe("Old House, Dhaka-1207");
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

  it("always sends a note, carrying the customer's instruction when there is one", () => {
    // Changed 2026-09-05 on the merchant's instruction: every diecast parcel
    // now goes out with the fragile-handling note, whether or not the customer
    // wrote anything. Previously the field was omitted entirely.
    expect(buildCreateOrderPayload(order()).note).toBe(FRAGILE_NOTE);
    expect(buildCreateOrderPayload(order({ deliveryNote: "Call first" })).note)
      .toBe(`Call first — ${FRAGILE_NOTE}`);
  });
});

describe("isTerminal — which parcels are worth re-polling", () => {
  it.each(["delivered", "partial_delivered", "cancelled"])("%s is finished", (s) => expect(isTerminal(s)).toBe(true));
  it.each(["pending", "in_review", "hold", "unknown", "delivered_approval_pending", "cancelled_approval_pending"])(
    "%s is still moving",
    (s) => expect(isTerminal(s)).toBe(false)
  );
});

/** Merchant's report from the Steadfast portal (2026-09-05): the parcel arrived
 * with no item description, no note, and an address that read
 * "Southern park 2, Nabinbagh, Rampura, Dhaka 1219, Rampura, Dhaka City" —
 * the area typed once by the customer and once by us. */
describe("the address Steadfast's portal actually parses", () => {
  const rampura = {
    recipientName: "Rafsan",
    phone: "01977002762",
    addressLine1: "Southern park 2, Nabinbagh, Rampura, Dhaka 1219",
    thana: "Rampura",
    district: "Dhaka City",
  };

  it("stops repeating the thana and district the customer already typed", () => {
    expect(buildRecipientAddress(rampura)).toBe("Southern park 2, Nabinbagh, Rampura, Dhaka City-1219");
  });

  it("keeps the postcode out of the dropped segment rather than losing it", () => {
    expect(buildRecipientAddress(rampura)).toContain("1219");
  });

  it("still ENDS with the courier's own thana and district spelling", () => {
    // This is the whole reason the ending is controlled: Steadfast has no
    // district/thana parameter, so their portal parses this tail.
    expect(buildRecipientAddress(rampura).endsWith("Rampura, Dhaka City-1219")).toBe(true);
  });

  it("appends the area when the customer did NOT type it", () => {
    expect(buildRecipientAddress({ addressLine1: "House 17, Road 3/A", thana: "Dhanmondi", district: "Dhaka City" }))
      .toBe("House 17, Road 3/A, Dhanmondi, Dhaka City");
  });

  it("does not eat a real place that merely starts like the thana", () => {
    const a = { addressLine1: "Rampura Bazar, shop 4", thana: "Rampura", district: "Dhaka City" };
    expect(buildRecipientAddress(a)).toBe("Rampura Bazar, shop 4, Rampura, Dhaka City");
  });

  it("handles a legacy order with a free-text city and no thana", () => {
    expect(buildRecipientAddress({ addressLine1: "House 5, Mirpur 10", city: "Dhaka", postalCode: "1216" }))
      .toBe("House 5, Mirpur 10, Dhaka-1216");
  });

  it("still respects the 250-character cap", () => {
    const long = { addressLine1: "Word ".repeat(80), thana: "Rampura", district: "Dhaka City" };
    expect(buildRecipientAddress(long).length).toBeLessThanOrEqual(250);
  });
});

describe("item_description and note", () => {
  const order = (over = {}) => ({
    orderNumber: "DBD-20260904-3118C1",
    amountDue: 1560,
    shippingAddress: { recipientName: "Rafsan", phone: "01977002762", addressLine1: "Southern park 2", thana: "Rampura", district: "Dhaka City" },
    items: [{ title: "Hot Wheels Premium Nissan Skyline", qty: 1 }],
    ...over,
  });

  it("describes the items with their quantities, as the merchant asked", () => {
    expect(buildCreateOrderPayload(order()).item_description).toBe("1x Hot Wheels Premium Nissan Skyline");
  });

  it("lists every line of a multi-item order", () => {
    const p = buildCreateOrderPayload(order({ items: [{ title: "Supra MK4", qty: 2 }, { title: "BMW M3", qty: 1 }] }));
    expect(p.item_description).toBe("2x Supra MK4, 1x BMW M3");
  });

  it("sends the fragile note in English and Bangla by default", () => {
    const note = buildCreateOrderPayload(order()).note;
    expect(note).toContain("Fragile item please handle carefully");
    expect(note).toContain("ভঙ্গুর পণ্য");
  });

  it("puts the customer's own instruction FIRST, and keeps the fragile note", () => {
    const note = buildCreateOrderPayload(order({ deliveryNote: "Call before coming" })).note;
    expect(note.startsWith("Call before coming")).toBe(true);
    expect(note).toContain("ভঙ্গুর পণ্য");
    expect(note.length).toBeLessThanOrEqual(250);
  });

  it("never sends an empty item_description key", () => {
    expect(buildCreateOrderPayload(order({ items: [] }))).not.toHaveProperty("item_description");
  });

  it("leaves cod_amount alone — none of this touches the money", () => {
    expect(buildCreateOrderPayload(order()).cod_amount).toBe(1560);
  });
});
