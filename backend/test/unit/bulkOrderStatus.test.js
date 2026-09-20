import { describe, it, expect, vi, beforeEach } from "vitest";

// bulkTransitionOrderStatus runs the REAL transitionOrderStatus once per order,
// because order status drives the reserved/committed/released stock buckets and
// a bulk write around it would move labels while leaving inventory behind.
// These mocks stub the database, not the transition, so the bucket logic still
// executes and the test covers what the wrapper actually does with it.

const stockWrites = [];
const savedOrders = [];
let ordersById = {};

const makeOrder = (id, orderNumber, status, items = [{ product: `p-${id}`, qty: 1 }]) => ({
  _id: id,
  orderNumber,
  status,
  items,
  statusHistory: [],
  save: vi.fn(async function save() {
    savedOrders.push({ orderNumber: this.orderNumber, status: this.status });
  }),
});

vi.mock("mongoose", () => {
  const session = {
    withTransaction: async (fn) => fn(),
    endSession: () => {},
  };
  return { default: { startSession: async () => session, Schema: class {}, model: () => ({}) } };
});

vi.mock("../../src/modules/orders/order.model.js", () => ({
  Order: {
    findById: (id) => {
      const order = ordersById[id] ?? null;
      // Mongoose queries are thenable and chainable; the wrapper calls
      // .select().lean() when naming a failed order.
      const q = Promise.resolve(order);
      q.select = () => q;
      q.lean = () => q;
      return q;
    },
  },
}));

vi.mock("../../src/modules/products/product.model.js", () => ({
  Product: {
    updateOne: async (filter, update) => {
      stockWrites.push({ product: filter._id, ...update.$inc });
    },
  },
}));
vi.mock("../../src/modules/inventoryLogs/inventoryLog.model.js", () => ({ InventoryLog: { create: async () => {} } }));
vi.mock("../../src/modules/analytics/analytics.service.js", () => ({ recomputeRollupsForOrders: async () => {} }));
vi.mock("../../src/modules/cart/cart.model.js", () => ({ Cart: {} }));
vi.mock("../../src/modules/settings/settings.model.js", () => ({ Settings: {} }));
vi.mock("../../src/modules/coupons/coupon.model.js", () => ({ Coupon: {} }));
vi.mock("../../src/modules/auditLogs/auditLog.model.js", () => ({ AuditLog: {} }));

const { bulkTransitionOrderStatus } = await import("../../src/modules/orders/order.service.js");

beforeEach(() => {
  stockWrites.length = 0;
  savedOrders.length = 0;
  ordersById = {};
});

const seed = (...orders) => {
  for (const o of orders) ordersById[o._id] = o;
  return orders.map((o) => o._id);
};

describe("bulkTransitionOrderStatus", () => {
  it("moves every selected order and reports what it moved", async () => {
    const ids = seed(makeOrder("a", "DBD-1", "pending"), makeOrder("b", "DBD-2", "pending"));
    const { updated, skipped, failed } = await bulkTransitionOrderStatus({
      orderIds: ids,
      newStatus: "confirmed",
      actorId: "admin",
    });

    expect(updated).toHaveLength(2);
    expect(skipped).toHaveLength(0);
    expect(failed).toHaveLength(0);
    expect(savedOrders).toEqual([
      { orderNumber: "DBD-1", status: "confirmed" },
      { orderNumber: "DBD-2", status: "confirmed" },
    ]);
  });

  it("actually moves stock, rather than relabelling the order", async () => {
    // pending → confirmed converts a hold into a sale: stock down, hold released.
    const ids = seed(makeOrder("a", "DBD-1", "pending", [{ product: "car-1", qty: 2 }]));
    await bulkTransitionOrderStatus({ orderIds: ids, newStatus: "confirmed", actorId: "admin" });
    expect(stockWrites).toEqual([{ product: "car-1", stock: -2, reservedStock: -2 }]);
  });

  it("leaves stock alone for a same-bucket move", async () => {
    // confirmed → packed is a label change; both are committed.
    const ids = seed(makeOrder("a", "DBD-1", "confirmed"));
    await bulkTransitionOrderStatus({ orderIds: ids, newStatus: "packed", actorId: "admin" });
    expect(stockWrites).toHaveLength(0);
  });

  it("reports an order already at the target as skipped, not failed", async () => {
    // Selecting ten and moving them to packed when three already are is a
    // success — but transitionOrderStatus throws on a no-op move.
    const ids = seed(makeOrder("a", "DBD-1", "packed"), makeOrder("b", "DBD-2", "confirmed"));
    const { updated, skipped, failed } = await bulkTransitionOrderStatus({
      orderIds: ids,
      newStatus: "packed",
      actorId: "admin",
    });

    expect(skipped).toEqual([{ orderNumber: "DBD-1" }]);
    expect(updated).toHaveLength(1);
    expect(failed).toHaveLength(0);
  });

  it("keeps going after a failure instead of abandoning the rest", async () => {
    // "missing" is not seeded, so its transition throws Order not found.
    const ids = [...seed(makeOrder("a", "DBD-1", "pending")), "missing", ...seed(makeOrder("c", "DBD-3", "pending"))];
    const { updated, failed } = await bulkTransitionOrderStatus({
      orderIds: ids,
      newStatus: "confirmed",
      actorId: "admin",
    });

    expect(updated).toHaveLength(2);
    expect(failed).toHaveLength(1);
    expect(failed[0].message).toMatch(/not found/i);
  });

  it("names a failed order rather than reporting an opaque count", async () => {
    const ids = ["missing"];
    const { failed } = await bulkTransitionOrderStatus({ orderIds: ids, newStatus: "confirmed", actorId: "admin" });
    // No order document to read a number from, so the id is the best label.
    expect(failed[0].orderNumber).toBe("missing");
  });

  it("records who made each change on the order's own history", async () => {
    const order = makeOrder("a", "DBD-1", "pending");
    await bulkTransitionOrderStatus({ orderIds: seed(order), newStatus: "confirmed", actorId: "admin-7" });
    // There is no auditLog middleware on the bulk route (it keys off a single
    // req.params.id), so this per-order trail is the audit record.
    expect(order.statusHistory).toHaveLength(1);
    expect(order.statusHistory[0]).toMatchObject({ status: "confirmed", changedBy: "admin-7" });
  });

  it("returns the previous status, so the caller can decide about emails", async () => {
    const ids = seed(makeOrder("a", "DBD-1", "pending"));
    const { updated } = await bulkTransitionOrderStatus({ orderIds: ids, newStatus: "confirmed", actorId: "admin" });
    // The "order confirmed" email must fire only on the real move out of
    // pending, never on a relabel or a restore.
    expect(updated[0].previousStatus).toBe("pending");
  });
});
