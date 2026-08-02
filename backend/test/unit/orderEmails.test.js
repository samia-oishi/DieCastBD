import { describe, it, expect, vi, beforeEach } from "vitest";

// The real .env leaks into tests via dotenv (config/env.js imports it), so
// never rely on RESEND_API_KEY being absent — mock env and the client instead.
const sendMock = vi.fn().mockResolvedValue({ data: { id: "email_1" }, error: null });
vi.mock("../../src/emails/resendClient.js", () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}));
vi.mock("../../src/config/env.js", () => ({
  env: {
    RESEND_API_KEY: "test-key",
    EMAIL_FROM: "DiecastBD <noreply@diecastbd.com>",
    CLIENT_URL: "https://diecastbd.com",
    ADMIN_EMAILS: ["diecastbd.official@gmail.com"],
  },
}));

const { sendAdminNewOrderEmail } = await import("../../src/emails/adminNewOrder.js");
const { sendOrderConfirmedEmail, shouldSendOrderConfirmedEmail } = await import("../../src/emails/orderConfirmed.js");

const order = {
  _id: "68b000000000000000000001",
  orderNumber: "DBD-2501",
  createdAt: new Date("2026-08-01T10:00:00Z"),
  items: [
    { title: "MINI GT #1094 Toyota Supra", qty: 2, price: 2390 },
    { title: "Card Protector", qty: 1, price: 200 },
  ],
  subtotal: 4980,
  discount: 500,
  couponCode: "SAVE500",
  shippingFee: 60,
  total: 4540,
  amountPaid: 60,
  amountDue: 4480,
  paymentMethod: "bkash",
  paymentOption: "deliveryOnly",
  bkashTransactionId: "4471",
  phone: "01711111111",
  deliveryNote: "Call before delivery <script>alert(1)</script>",
  shippingAddress: {
    recipientName: "Test Buyer",
    phone: "01711111111",
    addressLine1: "House 1, Road 2",
    city: "Dhaka",
    district: "Dhaka",
    postalCode: "1207",
  },
};

beforeEach(() => sendMock.mockClear());

describe("shouldSendOrderConfirmedEmail", () => {
  it.each([
    ["pending", "confirmed", true], // the one real confirmation moment
    ["packed", "confirmed", false], // backward relabel — already told
    ["shipped", "confirmed", false],
    ["cancelled", "confirmed", false], // restore — admin communicates manually
    ["pending", "packed", false],
    ["pending", "cancelled", false], // the cron path
    ["confirmed", "confirmed", false],
  ])("%s → %s ⇒ %s", (previousStatus, newStatus, expected) => {
    expect(shouldSendOrderConfirmedEmail({ previousStatus, newStatus })).toBe(expected);
  });
});

describe("sendAdminNewOrderEmail", () => {
  it("sends to the given recipient from EMAIL_FROM with the order essentials", async () => {
    await sendAdminNewOrderEmail(order, "diecastbd.official@gmail.com");
    expect(sendMock).toHaveBeenCalledTimes(1);
    const msg = sendMock.mock.calls[0][0];
    expect(msg.to).toBe("diecastbd.official@gmail.com");
    expect(msg.from).toBe("DiecastBD <noreply@diecastbd.com>");
    expect(msg.subject).toContain("DBD-2501");
    expect(msg.html).toContain("MINI GT #1094 Toyota Supra");
    expect(msg.html).toContain("https://diecastbd.com/admin/orders/68b000000000000000000001");
    // the admin verifies manual payments against this
    expect(msg.html).toContain("4471");
  });

  it("escapes customer-typed strings rather than shipping live HTML to the admin's inbox", async () => {
    await sendAdminNewOrderEmail(order, "x@y.z");
    const { html } = sendMock.mock.calls[0][0];
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("silently skips when there is no recipient — the order already succeeded", async () => {
    await sendAdminNewOrderEmail(order, undefined);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("throws when Resend reports an error so the caller's catch can log it", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "domain not verified" } });
    await expect(sendAdminNewOrderEmail(order, "x@y.z")).rejects.toThrow("domain not verified");
  });
});

describe("sendOrderConfirmedEmail", () => {
  it("addresses the customer by name with a subject distinct from the placement email", async () => {
    await sendOrderConfirmedEmail(order, { name: "Test Buyer", email: "buyer@example.com" });
    const msg = sendMock.mock.calls[0][0];
    expect(msg.to).toBe("buyer@example.com");
    expect(msg.subject).toBe("DBD-2501 is confirmed — we're getting it ready");
    expect(msg.html).toContain("Test Buyer");
    expect(msg.html).toContain("is confirmed");
  });

  it("shows the amount-due callout only when something is actually due", async () => {
    await sendOrderConfirmedEmail(order, { name: "T", email: "t@e.com" });
    expect(sendMock.mock.calls[0][0].html).toContain("due on delivery");
    sendMock.mockClear();
    await sendOrderConfirmedEmail({ ...order, amountDue: 0 }, { name: "T", email: "t@e.com" });
    expect(sendMock.mock.calls[0][0].html).not.toContain("due on delivery");
  });
});
