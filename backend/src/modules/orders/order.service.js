import mongoose from "mongoose";
import { effectivePrice } from "../../utils/pricing.js";
import { Cart } from "../cart/cart.model.js";
import { Product } from "../products/product.model.js";
import { Order } from "./order.model.js";
import { InventoryLog } from "../inventoryLogs/inventoryLog.model.js";
import { Settings } from "../settings/settings.model.js";
import { Coupon } from "../coupons/coupon.model.js";
import { findValidCoupon, calculateDiscount } from "../coupons/coupon.service.js";
import { assertPaymentMethodAllowed, calculateAmountPaid } from "./paymentPlan.service.js";
import { AuditLog } from "../auditLogs/auditLog.model.js";
import { recomputeRollupsForOrders } from "../analytics/analytics.service.js";
import { countsAsRevenue } from "../../config/constants.js";
import { resolveZoneForDistrict } from "../settings/shippingZone.js";
import { generateOrderNumber } from "../../utils/generateOrderNumber.js";
import { ApiError } from "../../utils/apiError.js";

// Every order status maps to exactly one of three stock states:
//   reserved  ("pending")                          — stock held via reservedStock, nothing decremented yet
//   committed (confirmed/packed/shipped/delivered)  — stock permanently decremented, no reservedStock hold
//   released  (cancelled/refunded)                  — no claim on stock at all (fully back in the public pool)
// transitionOrderStatus below is a small state machine over these three buckets —
// see the six cross-bucket branches for the exact stock delta each direction needs.
const COMMITTED_STATUSES = ["confirmed", "packed", "shipped", "delivered"];
const RELEASED_STATUSES = ["cancelled", "refunded"];

export function stockBucket(status) {
  if (COMMITTED_STATUSES.includes(status)) return "committed";
  if (RELEASED_STATUSES.includes(status)) return "released";
  return "reserved";
}

// Atomic compare-and-reserve over a normalized `{product: <doc>, qty}` list —
// shared by every order-creation path (cart checkout, guest checkout, Buy Now)
// so the stock/money math can never drift between them. Must run inside the
// caller's transaction session.
async function reserveStockForItems(normalizedItems, session) {
  const orderItems = [];
  const reservations = [];
  let subtotal = 0;

  for (const { product, qty } of normalizedItems) {
    // Effective selling price — mirror the model's rule (product.model.js): a
    // salePrice only applies when it's a real discount below the list price, so
    // a stray salePrice of 0 can never turn a paid product into a free order.
    const price = effectivePrice(product);

    // Atomic compare-and-reserve — if stock dropped since the item was last viewed,
    // this condition fails and the whole transaction rolls back automatically.
    const reserved = await Product.findOneAndUpdate(
      { _id: product._id, $expr: { $gte: [{ $subtract: ["$stock", "$reservedStock"] }, qty] } },
      { $inc: { reservedStock: qty } },
      { session, returnDocument: "after" }
    );
    if (!reserved) {
      throw ApiError.conflict(`"${product.title}" no longer has enough stock (requested ${qty})`);
    }

    reservations.push({ productId: product._id, qty });
    orderItems.push({
      product: product._id,
      sku: product.sku,
      title: product.title,
      thumbnail: product.thumbnail,
      price,
      // costPrice is select:false on Product, so both callers of this function
      // have to ask for it explicitly (see createOrderFromCart /
      // createOrderFromItems). ?? null keeps "not selected" and "no cost
      // recorded" as the same honest answer instead of an implicit 0.
      costPrice: product.costPrice ?? null,
      qty,
    });
    subtotal += price * qty;
  }

  return { orderItems, reservations, subtotal };
}

// Builds and persists the Order document from an already-resolved item list —
// the part of order creation that's identical regardless of where the items
// came from (server cart, guest request body, Buy Now). Must run inside the
// caller's transaction session.
async function buildAndSaveOrder({
  userId,
  normalizedItems,
  shippingAddress,
  phone,
  deliveryNote,
  couponCode,
  paymentMethod,
  paymentOption,
  bkashTransactionId,
  banglaQrReference,
  shippingZone,
  session,
}) {
  const { orderItems, reservations, subtotal } = await reserveStockForItems(normalizedItems, session);

  let discount = 0;
  let couponDoc = null;
  if (couponCode) {
    couponDoc = await findValidCoupon(couponCode);
    discount = calculateDiscount(couponDoc, subtotal);
  }

  const settings = await Settings.findOne().session(session);
  const zones = settings?.shippingZones ?? [];
  // Derive the zone from the ADDRESS, not from what the client sent. The fee is
  // a function of where the parcel is going, so letting the request choose it
  // meant a Rangpur address could be submitted with the Inside-Dhaka zone and
  // pay the city rate. Falls back to the requested name only when the address
  // has no district (an order placed before the district dropdowns existed).
  const derived = shippingAddress?.district ? resolveZoneForDistrict(zones, shippingAddress.district) : null;
  const zone = derived ?? zones.find((z) => z.name === shippingZone);
  // Falls back to 0 (not a throw) if the zone doesn't match any configured
  // zone — e.g. stale admin config — so a checkout never hard-fails over a
  // shipping-fee lookup miss; it just ships free rather than blocking the order.
  const zoneFee = zone?.fee ?? 0;
  const zoneRequiresPrepay = zone?.requiresPrepay ?? false;
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 0;
  const shippingFee = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : zoneFee;

  const total = subtotal - discount + shippingFee;

  const resolvedPaymentOption = paymentOption || "cod";
  assertPaymentMethodAllowed({ normalizedItems, paymentOption: resolvedPaymentOption, zoneRequiresPrepay });
  const {
    amountPaid,
    amountDue,
    advancePaymentPercent: resolvedAdvancePercent,
  } = calculateAmountPaid({ normalizedItems, subtotal, total, shippingFee, paymentOption: resolvedPaymentOption });

  let orderNumber = generateOrderNumber();
  if (await Order.exists({ orderNumber }).session(session)) {
    orderNumber = generateOrderNumber(); // vanishingly unlikely to collide twice
  }

  const [createdOrder] = await Order.create(
    [
      {
        orderNumber,
        user: userId,
        items: orderItems,
        shippingAddress,
        phone,
        deliveryNote,
        coupon: couponDoc?._id ?? null,
        couponCode: couponDoc?.code ?? null,
        subtotal,
        discount,
        shippingFee,
        total,
        paymentMethod,
        // Manual bKash/BanglaQR — no live gateway, so paymentStatus stays the
        // default "pending" until an admin manually verifies the reference and
        // marks it paid; only the reference itself is captured at order time.
        bkashTransactionId: paymentMethod === "bkash" ? bkashTransactionId : null,
        banglaQrReference: paymentMethod === "banglaqr" ? banglaQrReference : null,
        paymentOption: resolvedPaymentOption,
        advancePaymentPercent: resolvedAdvancePercent,
        amountPaid,
        amountDue,
        status: "pending",
        statusHistory: [{ status: "pending", changedBy: userId, at: new Date() }],
      },
    ],
    { session }
  );

  await InventoryLog.insertMany(
    reservations.map((r) => ({
      product: r.productId,
      type: "reservation",
      quantityChange: -r.qty,
      referenceOrder: createdOrder._id,
      performedBy: userId,
    })),
    { session }
  );

  if (couponDoc) {
    await Coupon.updateOne({ _id: couponDoc._id }, { $inc: { usedCount: 1 } }, { session });
  }

  return createdOrder;
}

export async function createOrderFromCart({
  userId,
  shippingAddress,
  phone,
  deliveryNote,
  couponCode,
  paymentMethod,
  paymentOption,
  bkashTransactionId,
  banglaQrReference,
  shippingZone,
}) {
  // "+costPrice" is required, not cosmetic: costPrice is select:false on
  // Product, so without it reserveStockForItems snapshots a null cost and every
  // order placed through the cart reports unknown profit forever after.
  const cart = await Cart.findOne({ user: userId }).populate({ path: "items.product", select: "+costPrice" });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest("Your cart is empty");

  const activeItems = cart.items.filter(
    (i) => i.product && i.product.status === "active" && !i.product.isDeleted
  );
  if (activeItems.length === 0) throw ApiError.badRequest("Your cart items are no longer available");

  const normalizedItems = activeItems.map((i) => ({ product: i.product, qty: i.qty }));

  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      order = await buildAndSaveOrder({
        userId,
        normalizedItems,
        shippingAddress,
        phone,
        deliveryNote,
        couponCode,
        paymentMethod,
        paymentOption,
        bkashTransactionId,
        banglaQrReference,
        shippingZone,
        session,
      });

      cart.items = [];
      await cart.save({ session });
    });
  } finally {
    session.endSession();
  }

  return order;
}

// Guest checkout and Buy Now both send cart items directly in the request body
// instead of relying on a server-side Cart document — guest carts never touch
// the server (they're Zustand/localStorage-only), and Buy Now deliberately
// bypasses whatever's already in the cart rather than merging with it. Shares
// buildAndSaveOrder with createOrderFromCart so the money/inventory math can
// never drift between the two entry points. Deliberately takes an already-
// resolved userId, not guest-identity fields — identity resolution (existing
// Firebase user vs. find-or-create guest) happens in the controller before
// this is called, so this function doesn't need to know which kind of user it is.
export async function createOrderFromItems({
  userId,
  items,
  shippingAddress,
  phone,
  deliveryNote,
  couponCode,
  paymentMethod,
  paymentOption,
  bkashTransactionId,
  banglaQrReference,
  shippingZone,
}) {
  if (!items || items.length === 0) throw ApiError.badRequest("No items to order");

  const productIds = items.map((i) => i.productId);
  // "+costPrice" for the same reason as the cart path above — this is the Buy
  // Now / guest-checkout route into the identical snapshot code.
  const products = await Product.find({ _id: { $in: productIds }, status: "active", isDeleted: false }).select("+costPrice");
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const normalizedItems = items
    .filter((i) => productMap.has(i.productId))
    .map((i) => ({ product: productMap.get(i.productId), qty: i.qty }));

  if (normalizedItems.length === 0) throw ApiError.badRequest("Your order items are no longer available");

  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      order = await buildAndSaveOrder({
        userId,
        normalizedItems,
        shippingAddress,
        phone,
        deliveryNote,
        couponCode,
        paymentMethod,
        paymentOption,
        bkashTransactionId,
        banglaQrReference,
        shippingZone,
        session,
      });
    });
  } finally {
    session.endSession();
  }

  return order;
}

export async function transitionOrderStatus({
  orderId,
  newStatus,
  note,
  actorId,
  trackingNumber,
  courierName,
}) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found");

  // Captured before the in-place mutation below — callers deciding whether a
  // transition deserves a side effect (the "order confirmed" email) need to
  // know where the order came FROM, and by return time order.status is
  // already the new value.
  const previousStatus = order.status;

  // Admin can move an order to any status, including reverting out of
  // cancelled/refunded — there is no terminal lock. Each of the six possible
  // cross-bucket moves below needs its own exact stock delta; same-bucket
  // moves (e.g. confirmed -> packed, or cancelled -> refunded) are pure
  // status-label changes with no stock effect.
  if (order.status === newStatus) {
    throw ApiError.badRequest(`Order is already ${newStatus}`);
  }

  const fromBucket = stockBucket(order.status);
  const toBucket = stockBucket(newStatus);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.items) {
        if (fromBucket === "reserved" && toBucket === "committed") {
          // pending -> confirmed/packed/shipped/delivered: convert the hold into a permanent sale.
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: -item.qty, reservedStock: -item.qty } },
            { session }
          );
          await InventoryLog.create(
            [{ product: item.product, type: "sale", quantityChange: -item.qty, referenceOrder: order._id, performedBy: actorId }],
            { session }
          );
        } else if (fromBucket === "committed" && toBucket === "reserved") {
          // confirmed/.../delivered -> pending: undo the sale AND restore the hold — the
          // order is still live, so its stock stays unavailable to other customers either way.
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.qty, reservedStock: item.qty } },
            { session }
          );
          await InventoryLog.create(
            [
              {
                product: item.product,
                type: "adjustment",
                quantityChange: item.qty,
                reason: `Status reverted from ${order.status} to ${newStatus}`,
                referenceOrder: order._id,
                performedBy: actorId,
              },
            ],
            { session }
          );
        } else if (fromBucket === "reserved" && toBucket === "released") {
          // pending -> cancelled/refunded: release the hold, nothing was ever decremented.
          await Product.updateOne({ _id: item.product }, { $inc: { reservedStock: -item.qty } }, { session });
          await InventoryLog.create(
            [{ product: item.product, type: "release", quantityChange: item.qty, referenceOrder: order._id, performedBy: actorId }],
            { session }
          );
        } else if (fromBucket === "committed" && toBucket === "released") {
          // confirmed/.../delivered -> cancelled/refunded: restore the permanently-decremented stock.
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } }, { session });
          await InventoryLog.create(
            [
              {
                product: item.product,
                type: "adjustment",
                quantityChange: item.qty,
                reason: `Order ${newStatus} after ${order.status}`,
                referenceOrder: order._id,
                performedBy: actorId,
              },
            ],
            { session }
          );
        } else if (fromBucket === "released" && toBucket === "reserved") {
          // cancelled/refunded -> pending: re-hold the stock. Unlike every other branch here,
          // this genuinely re-checks availability — other sales may have consumed the
          // inventory while this order sat cancelled, so it's not safe to assume the hold
          // can just be re-established blindly.
          const reserved = await Product.findOneAndUpdate(
            { _id: item.product, $expr: { $gte: [{ $subtract: ["$stock", "$reservedStock"] }, item.qty] } },
            { $inc: { reservedStock: item.qty } },
            { session, returnDocument: "after" }
          );
          if (!reserved) {
            throw ApiError.conflict(`Cannot restore order — "${item.title}" no longer has enough stock`);
          }
          await InventoryLog.create(
            [
              {
                product: item.product,
                type: "adjustment",
                quantityChange: -item.qty,
                reason: `Order restored from ${order.status} to ${newStatus}`,
                referenceOrder: order._id,
                performedBy: actorId,
              },
            ],
            { session }
          );
        } else if (fromBucket === "released" && toBucket === "committed") {
          // cancelled/refunded -> confirmed/packed/shipped/delivered: re-commit directly,
          // skipping the reserved bucket entirely. Same fresh availability check as above.
          const committed = await Product.findOneAndUpdate(
            { _id: item.product, $expr: { $gte: [{ $subtract: ["$stock", "$reservedStock"] }, item.qty] } },
            { $inc: { stock: -item.qty } },
            { session, returnDocument: "after" }
          );
          if (!committed) {
            throw ApiError.conflict(`Cannot restore order — "${item.title}" no longer has enough stock`);
          }
          await InventoryLog.create(
            [
              {
                product: item.product,
                type: "adjustment",
                quantityChange: -item.qty,
                reason: `Order restored from ${order.status} to ${newStatus}`,
                referenceOrder: order._id,
                performedBy: actorId,
              },
            ],
            { session }
          );
        }
        // Same-bucket transitions fall through with no stock effect.
      }

      order.status = newStatus;
      order.statusHistory.push({ status: newStatus, note, changedBy: actorId, at: new Date() });
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (courierName) order.courierName = courierName;
      await order.save({ session });
    });
  } finally {
    session.endSession();
  }

  // Reports count only orders the store actually earned from, so a transition
  // changes the numbers exactly when it crosses that line — pending →
  // confirmed books the sale, confirmed → cancelled/refunded takes it back
  // out, and a restore puts it back. Every other move (packed → shipped)
  // leaves totals identical and skips the work. This MUST use the same
  // predicate the rollup queries with, or confirming an order would quietly
  // fail to update the report.
  if (countsAsRevenue(previousStatus) !== countsAsRevenue(newStatus)) {
    await recomputeRollupsForOrders([order]);
  }

  return { order, previousStatus };
}

/**
 * Permanently deletes orders (admin bulk action) — "this order never happened".
 *
 * Deleting an order is stock-relevant, which is the whole reason this can't be a
 * bare `deleteMany`. An order always holds exactly one of the three stock claims
 * (see stockBucket above), and destroying the row must hand that claim back or the
 * inventory silently rots:
 *
 *   reserved  (pending)                     -> release the hold. Nothing was ever
 *                                              decremented, so only reservedStock moves.
 *                                              Skipping this would leak the reservation
 *                                              FOREVER — availableStock would drop with
 *                                              no order left on the books to explain it.
 *   committed (confirmed..delivered)        -> the sale was already decremented from
 *                                              stock, so give the units back. We're
 *                                              asserting the order never happened.
 *   released  (cancelled/refunded)          -> holds no claim at all; nothing to undo.
 *
 * All of it — stock, logs, and the deletes — runs in ONE transaction, so a mid-flight
 * failure can't leave stock adjusted for an order that still exists (or vice versa).
 *
 * The audit entry deliberately carries the FULL order snapshot in `before`: once the
 * row is gone this is the only surviving copy of it, so it doubles as the recovery
 * path. That's also why this doesn't use the auditLog() middleware — that helper keys
 * off a single req.params.id and can't snapshot each order in a bulk delete.
 */
export async function deleteOrders({ orderIds, actorId }) {
  const orders = await Order.find({ _id: { $in: orderIds } });
  if (orders.length === 0) throw ApiError.notFound("No matching orders found");

  const session = await mongoose.startSession();
  let unitsReturnedToStock = 0;

  try {
    await session.withTransaction(async () => {
      for (const order of orders) {
        const bucket = stockBucket(order.status);

        for (const item of order.items) {
          if (bucket === "reserved") {
            await Product.updateOne({ _id: item.product }, { $inc: { reservedStock: -item.qty } }, { session });
          } else if (bucket === "committed") {
            await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } }, { session });
          } else {
            continue; // released: no claim on stock, nothing to give back
          }

          // referenceOrder is intentionally left null — the order it would point at is
          // about to stop existing. The order NUMBER goes in `reason` so the stock
          // movement stays traceable to it after the fact.
          await InventoryLog.create(
            [
              {
                product: item.product,
                type: bucket === "reserved" ? "release" : "adjustment",
                quantityChange: item.qty,
                reason: `Order ${order.orderNumber} deleted (was ${order.status})`,
                performedBy: actorId,
              },
            ],
            { session }
          );
          unitsReturnedToStock += item.qty;
        }

        await AuditLog.create(
          [
            {
              actor: actorId,
              action: "DELETE /admin/orders",
              entityType: "Order",
              entityId: order._id.toString(),
              before: order.toObject(),
              after: null,
            },
          ],
          { session }
        );
      }

      await Order.deleteMany({ _id: { $in: orders.map((o) => o._id) } }, { session });
    });
  } finally {
    session.endSession();
  }

  // Reports are derived from orders, but the cron only recomputes yesterday —
  // so without this a deleted order's revenue stayed on the Reports page
  // forever. Runs after the transaction commits, so the recompute reads the
  // post-delete truth. Awaited (not fire-and-forget) so the admin's next report
  // load can't race it.
  await recomputeRollupsForOrders(orders);

  return { deletedCount: orders.length, unitsReturnedToStock };
}
