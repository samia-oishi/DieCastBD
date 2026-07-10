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

// Statuses at/after which stock has been permanently committed (decremented),
// as opposed to merely held via reservedStock.
const STOCK_COMMITTED_STATUSES = ["confirmed", "packed", "shipped", "delivered"];
const TERMINAL_STATUSES = ["cancelled", "refunded"];

// Atomic compare-and-reserve over a normalized `{product: <doc>, qty}` list —
// shared by every order-creation path (cart checkout, guest checkout, Buy Now)
// so the stock/money math can never drift between them. Must run inside the
// caller's transaction session.
async function reserveStockForItems(normalizedItems, session) {
  const orderItems = [];
  const reservations = [];
  let subtotal = 0;

  for (const { product, qty } of normalizedItems) {
    const price = product.salePrice ?? product.price;

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

  if (TERMINAL_STATUSES.includes(order.status)) {
    throw ApiError.conflict(`Order is already ${order.status} and cannot be changed further`);
  }
  if (order.status === newStatus) {
    throw ApiError.badRequest(`Order is already ${newStatus}`);
  }

  const wasCommitted = STOCK_COMMITTED_STATUSES.includes(order.status);
  const willBeCommitted = STOCK_COMMITTED_STATUSES.includes(newStatus);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (newStatus === "cancelled") {
        for (const item of order.items) {
          if (wasCommitted) {
            // Stock was already permanently decremented at confirm-time — restore it.
            await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } }, { session });
            await InventoryLog.create(
              [
                {
                  product: item.product,
                  type: "adjustment",
                  quantityChange: item.qty,
                  reason: "Order cancelled after confirmation",
                  referenceOrder: order._id,
                  performedBy: actorId,
                },
              ],
              { session }
            );
          } else {
            await Product.updateOne({ _id: item.product }, { $inc: { reservedStock: -item.qty } }, { session });
            await InventoryLog.create(
              [
                {
                  product: item.product,
                  type: "release",
                  quantityChange: item.qty,
                  referenceOrder: order._id,
                  performedBy: actorId,
                },
              ],
              { session }
            );
          }
        }
      } else if (!wasCommitted && willBeCommitted) {
        // First crossing into a committed status (pending -> confirmed) — convert the hold into a real sale.
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: -item.qty, reservedStock: -item.qty } },
            { session }
          );
          await InventoryLog.create(
            [
              {
                product: item.product,
                type: "sale",
                quantityChange: -item.qty,
                referenceOrder: order._id,
                performedBy: actorId,
              },
            ],
            { session }
          );
        }
      }
      // Otherwise a pure status label change (confirmed -> packed -> shipped -> delivered) — no stock effect.

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
