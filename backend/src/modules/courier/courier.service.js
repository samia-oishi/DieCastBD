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
          // One unreachable consignment must not blank the whole list — the
          // order keeps its last known status and is retried next time.
          console.error(`Courier sync failed for order ${order._id}: ${err.message}`);
        }
      })
    );
  }

  return updated;
}
