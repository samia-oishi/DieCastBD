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

// -----------------------------------------------------------------------------

import { classifySteadfastError } from "../../src/modules/courier/steadfast.client.js";

/** Steadfast answers 401 for two unrelated things. Getting this wrong either
 * locks the merchant's courier account or blames their credentials for a typo,
 * so the distinction is pinned here. Both shapes were observed live. */
describe("classifySteadfastError — telling a lockout apart from a typo", () => {
  it("treats a credential 401 as an auth failure, carrying the lockout counter", () => {
    const c = classifySteadfastError(401, {
      status: 401,
      message: "Unauthorized Access (invalid API credentials)",
      attempts_left: 8,
    });
    expect(c.kind).toBe("auth");
    expect(c.attemptsLeft).toBe(8);
    expect(c.message).toMatch(/8 attempts left/);
  });

  it("treats a 401 with no counter as an unknown consignment, NOT an auth failure", () => {
    // Verified against the live API: this shape comes back as bare text for a
    // bogus consignment id, and a get_balance straight afterwards still
    // succeeds — so it costs nothing against the lockout budget.
    const c = classifySteadfastError(401, null);
    expect(c.kind).toBe("not_found");
    expect(c.message).toMatch(/does not recognise/);
  });

  it("treats 404 the same way", () => {
    expect(classifySteadfastError(404, null).kind).toBe("not_found");
  });

  it("passes through Steadfast's own message for other failures", () => {
    expect(classifySteadfastError(422, { message: "Invoice must be unique" }).message).toBe("Invoice must be unique");
    expect(classifySteadfastError(500, null).message).toBe("HTTP 500");
  });

  it("never reports auth failure without a counter to justify it", () => {
    // The guard that stops a typo from looking like a credentials problem.
    for (const body of [null, {}, { message: "Unauthorized Access" }]) {
      expect(classifySteadfastError(401, body).kind).not.toBe("auth");
    }
  });
});
