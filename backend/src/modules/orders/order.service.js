import mongoose from "mongoose";
import { Cart } from "../cart/cart.model.js";
import { Product } from "../products/product.model.js";
import { Order } from "./order.model.js";
import { InventoryLog } from "../inventoryLogs/inventoryLog.model.js";
import { Settings } from "../settings/settings.model.js";
import { Coupon } from "../coupons/coupon.model.js";
import { findValidCoupon, calculateDiscount } from "../coupons/coupon.service.js";
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
    const price = product.salePrice != null && product.salePrice < product.price ? product.salePrice : product.price;

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
  // Falls back to 0 (not a throw) if the zone doesn't match any configured
  // zone — e.g. stale admin config — so a checkout never hard-fails over a
  // shipping-fee lookup miss; it just ships free rather than blocking the order.
  const zoneFee = settings?.shippingZones?.find((z) => z.name === shippingZone)?.fee ?? 0;
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 0;
  const shippingFee = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : zoneFee;

  const total = subtotal - discount + shippingFee;

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
  bkashTransactionId,
  banglaQrReference,
  shippingZone,
}) {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
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
  bkashTransactionId,
  banglaQrReference,
  shippingZone,
}) {
  if (!items || items.length === 0) throw ApiError.badRequest("No items to order");

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, status: "active", isDeleted: false });
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

  return order;
}
