import { describe, it, expect } from "vitest";

import { isTerminal, TERMINAL_STATUSES } from "../../src/modules/courier/steadfast.payload.js";

/** Mirrors the Mongo filter in courier.service.js syncCourierStatuses(). Kept as
 * a plain predicate so the selection rules are testable without a database —
 * the rules are what protect the merchant's API quota and their account. */
const SYNC_THROTTLE_MS = 5 * 60 * 1000;
const shouldSync = (order, now = Date.now()) => {
  if (!order.courier?.consignmentId) return false;
  if (isTerminal(order.courier.status)) return false;
  const last = order.courier.lastSyncedAt;
  return !last || now - new Date(last).getTime() >= SYNC_THROTTLE_MS;
};

const parcel = (over = {}) => ({ courier: { consignmentId: "1424107", status: "in_review", lastSyncedAt: null, ...over } });

describe("which parcels get re-polled", () => {
  it("skips an order that was never sent — there is nothing to ask about", () => {
    expect(shouldSync({ courier: null })).toBe(false);
    expect(shouldSync({ courier: { consignmentId: null, status: null } })).toBe(false);
  });

  it.each(TERMINAL_STATUSES)("skips %s — a finished parcel never changes again", (status) => {
    expect(shouldSync(parcel({ status }))).toBe(false);
  });

  it.each(["pending", "in_review", "hold", "unknown", "delivered_approval_pending"])(
    "still polls %s",
    (status) => {
      expect(shouldSync(parcel({ status }))).toBe(true);
    }
  );

  it("throttles: a parcel checked a minute ago is left alone", () => {
    const now = Date.now();
    expect(shouldSync(parcel({ lastSyncedAt: new Date(now - 60 * 1000) }), now)).toBe(false);
  });

  it("polls again once the throttle window has passed", () => {
    const now = Date.now();
    expect(shouldSync(parcel({ lastSyncedAt: new Date(now - 6 * 60 * 1000) }), now)).toBe(true);
  });

  it("polls a parcel that has never been checked", () => {
    expect(shouldSync(parcel({ lastSyncedAt: null }))).toBe(true);
  });

  it("opening the list twice in a row costs one round of calls, not two", () => {
    // The regression this guards: without the throttle, every list render or tab
    // switch would fire a call per in-flight parcel.
    const now = Date.now();
    const orders = [parcel(), parcel(), parcel()];
    const first = orders.filter((o) => shouldSync(o, now));
    expect(first).toHaveLength(3);
    first.forEach((o) => { o.courier.lastSyncedAt = new Date(now); });
    expect(orders.filter((o) => shouldSync(o, now + 1000))).toHaveLength(0);
  });
});
