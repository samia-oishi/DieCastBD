import { Order } from "../modules/orders/order.model.js";
import { transitionOrderStatus } from "../modules/orders/order.service.js";

const STALE_AFTER_HOURS = 48;

/** COD orders left unconfirmed indefinitely would hold their reserved stock
 * hostage forever with no way to reclaim it — auto-cancel (which already
 * releases the reservation via transitionOrderStatus) after a grace period. */
export async function releaseStaleReservations() {
  const cutoff = new Date(Date.now() - STALE_AFTER_HOURS * 60 * 60 * 1000);
  const staleOrders = await Order.find({ status: "pending", createdAt: { $lte: cutoff } });

  let released = 0;
  for (const order of staleOrders) {
    try {
      await transitionOrderStatus({
        orderId: order._id,
        newStatus: "cancelled",
        note: `Auto-cancelled: unconfirmed after ${STALE_AFTER_HOURS}h`,
        actorId: null,
      });
      released++;
    } catch (err) {
      console.error(`Failed to auto-cancel stale order ${order.orderNumber}:`, err.message);
    }
  }

  if (released > 0) console.log(`Released stock reservations for ${released} stale order(s)`);
  return released;
}
