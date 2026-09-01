import { Order } from "../orders/order.model.js";
import { createConsignment, getDeliveryStatus, isCourierConfigured } from "./steadfast.client.js";
import { buildCreateOrderPayload, courierBlockReason, isTerminal } from "./steadfast.payload.js";
import { ApiError } from "../../utils/apiError.js";

/** Don't re-ask the courier about a parcel we checked moments ago. The orders
 * list syncs on every open, and without this a few tab-switches would fire
 * dozens of calls. Steadfast documents no rate limit, which is a reason to be
 * more careful here, not less. */
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

/** How many status lookups to have in flight at once. */
const SYNC_CONCURRENCY = 5;

/** Creates the Steadfast consignment for one order.
 *
 * Idempotent by refusal, not by retry: a second consignment is a second real
 * parcel and a second collection attempt, so a duplicate send is a hard 409
 * rather than something we quietly absorb.
 */
export async function sendOrderToCourier(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found");

  const blocked = courierBlockReason(order);
  if (blocked) throw ApiError.conflict(blocked);

  const payload = buildCreateOrderPayload(order);
  const response = await createConsignment(payload);
  const consignment = response?.consignment;
  if (!consignment?.consignment_id) {
    // The parcel may well exist at this point, so say so rather than implying
    // nothing happened — the merchant needs to check the panel before retrying.
    throw ApiError.badGateway(
      "Steadfast accepted the request but returned no consignment id — check the Steadfast panel before sending again"
    );
  }

  order.courier = {
    provider: "steadfast",
    consignmentId: String(consignment.consignment_id),
    trackingCode: consignment.tracking_code ?? null,
    status: consignment.status ?? "pending",
    sentAt: new Date(),
    lastSyncedAt: new Date(),
  };
  // Deliberately does NOT touch order.status. Handing a box to a courier is not
  // the same event as the merchant marking an order shipped, and running it
  // through transitionOrderStatus would move stock buckets as a side effect of
  // a courier action. Merchant's call; they still ship it themselves.
  await order.save();

  return order;
}

/** Refreshes delivery status for the given orders, skipping everything that
 * cannot have changed. Returns only the orders actually updated. */
export async function syncCourierStatuses(orderIds) {
  if (!isCourierConfigured() || !orderIds?.length) return [];

  const cutoff = new Date(Date.now() - SYNC_THROTTLE_MS);
  const orders = await Order.find({
    _id: { $in: orderIds },
    "courier.consignmentId": { $ne: null },
    // A delivered or cancelled parcel is finished — re-polling it is pure waste.
    "courier.status": { $nin: ["delivered", "partial_delivered", "cancelled"] },
    $or: [{ "courier.lastSyncedAt": null }, { "courier.lastSyncedAt": { $lt: cutoff } }],
  }).select("courier");

  const updated = [];
  for (let i = 0; i < orders.length; i += SYNC_CONCURRENCY) {
    const batch = orders.slice(i, i + SYNC_CONCURRENCY);
    await Promise.all(
      batch.map(async (order) => {
        try {
          const res = await getDeliveryStatus(order.courier.consignmentId);
          const status = res?.delivery_status;
          if (!status) return;
          order.courier.status = status;
          order.courier.lastSyncedAt = new Date();
          await order.save();
          updated.push({ id: String(order._id), status, terminal: isTerminal(status) });
        } catch (err) {
          // A credential failure is not per-parcel — it will hit every single
          // one, and each 401 burns a slot in Steadfast's lockout counter. Stop
          // the whole batch on the first, rather than working through the list
          // and locking the merchant's courier account.
          if (err.isAuthFailure) throw err;
          // Anything else is local to this consignment: keep the last known
          // status, retry next time, and don't blank the rest of the list.
          console.error(`Courier sync failed for order ${order._id}: ${err.message}`);
        }
      })
    );
  }

  return updated;
}

/** Attaches a consignment the merchant created directly in Steadfast's panel.
 *
 * Not every parcel starts here — a Facebook or phone order often gets booked in
 * Steadfast first. Linking it lets the same order show live progress without
 * pretending we created it.
 *
 * The id is checked against Steadfast before it is saved. A typo would
 * otherwise sit on the order looking authoritative while tracking silently
 * never worked, which is worse than refusing it now.
 */
export async function linkExistingConsignment(orderId, consignmentId, trackingCode) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found");
  if (order.courier?.consignmentId) {
    throw ApiError.conflict(`This order is already linked to consignment ${order.courier.consignmentId}`);
  }

  let status = null;
  try {
    const res = await getDeliveryStatus(consignmentId);
    status = res?.delivery_status ?? null;
  } catch (err) {
    // A 401 carrying no attempts_left means "no such consignment", not "bad
    // credentials" — see classifySteadfastError. Saying so precisely is the
    // difference between the merchant fixing a typo and them re-checking keys
    // that were never wrong.
    if (err.isAuthFailure) throw ApiError.badRequest(err.message);
    throw ApiError.badRequest(
      `Steadfast does not recognise consignment ${consignmentId} — check the number in their panel`
    );
  }

  order.courier = {
    provider: "steadfast",
    consignmentId: String(consignmentId).trim(),
    trackingCode: trackingCode?.trim() || null,
    status,
    // No sentAt: we did not send this one, and claiming we did would misdate it.
    sentAt: null,
    lastSyncedAt: new Date(),
  };
  await order.save();
  return order;
}
