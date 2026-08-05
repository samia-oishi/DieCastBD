import { Order } from "./order.model.js";
import { Address } from "../addresses/address.model.js";
import { User } from "../users/user.model.js";
import { findOrCreateGuestUser } from "../users/user.service.js";
import { createOrderFromCart, createOrderFromItems, transitionOrderStatus, deleteOrders } from "./order.service.js";
import { sendOrderConfirmationEmail } from "../../emails/orderConfirmation.js";
import { recomputeRollupsForOrders } from "../analytics/analytics.service.js";
import { sendAdminNewOrderEmail } from "../../emails/adminNewOrder.js";
import { sendOrderConfirmedEmail, shouldSendOrderConfirmedEmail } from "../../emails/orderConfirmed.js";
import { Settings } from "../settings/settings.model.js";
import { env } from "../../config/env.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createOrder = asyncHandler(async (req, res) => {
  const {
    addressId,
    items,
    guestInfo,
    shippingAddress: rawShippingAddress,
    phone,
    deliveryNote,
    couponCode,
    paymentMethod,
    paymentOption,
    bkashTransactionId,
    banglaQrReference,
    shippingZone,
  } = req.body;

  let userId;
  let shippingAddress;
  let emailTarget; // {name, email} — resolved once here so the send-path below doesn't care whether this was a guest or a real account

  if (req.user) {
    userId = req.user.id;

    if (addressId) {
      const address = await Address.findOne({ _id: addressId, user: userId });
      if (!address) throw ApiError.notFound("Shipping address not found");
      shippingAddress = {
        recipientName: address.recipientName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode,
      };
    } else if (rawShippingAddress) {
      // Buy Now (logged in) — no saved address selected, ship straight from
      // whatever address the checkout form collected inline.
      shippingAddress = rawShippingAddress;
    } else {
      throw ApiError.badRequest("A shipping address is required");
    }

    // req.user is the minimal JWT payload ({id, role}) — the email needs name/email,
    // which the token deliberately doesn't carry, so fetch the real record here.
    emailTarget = await User.findById(userId).select("name email");
  } else {
    // Guest checkout — no session, no saved Address book. Order.shippingAddress
    // is already a self-contained embedded snapshot, so guests never need an
    // Address document; the customer record is resolved/created by phone or email.
    if (!guestInfo?.name || !guestInfo?.phone) {
      throw ApiError.badRequest("Name and phone are required to check out as a guest");
    }
    if (!rawShippingAddress) {
      throw ApiError.badRequest("A shipping address is required");
    }

    const guestUser = await findOrCreateGuestUser(guestInfo);
    userId = guestUser._id;
    shippingAddress = rawShippingAddress;
    emailTarget = guestInfo.email ? { name: guestInfo.name, email: guestInfo.email } : null;
  }

  const orderArgs = {
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
  };
  const order =
    items && items.length > 0
      ? await createOrderFromItems({ ...orderArgs, items })
      : await createOrderFromCart(orderArgs);

  if (emailTarget?.email) {
    sendOrderConfirmationEmail(order, emailTarget).catch((err) =>
      console.error("Order confirmation email failed:", err.message)
    );
  }

  // Notify the store owner about every order, guest or not. The recipient
  // lookup lives inside the fire-and-forget so even a Settings read failure
  // can't touch order creation — the 201 below never waits on any of this.
  (async () => {
    const settings = await Settings.findOne().select("contactInfo.email");
    const recipient = settings?.contactInfo?.email || env.ADMIN_EMAILS[0];
    await sendAdminNewOrderEmail(order, recipient);
  })().catch((err) => console.error("Admin new-order email failed:", err.message));

  // Keep the Reports page live rather than nightly. Fire-and-forget: the
  // customer is waiting on this response and a rollup failure must never cost
  // them their order — the nightly cron would correct it anyway.
  recomputeRollupsForOrders([order]).catch((err) =>
    console.error("Analytics rollup after order failed:", err.message)
  );

  sendSuccess(res, { data: order, status: 201, message: "Order placed" });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  sendSuccess(res, { data: orders });
});

export const getMyOrderByNumber = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user.id });
  if (!order) throw ApiError.notFound("Order not found");
  sendSuccess(res, { data: order });
});

export const listOrdersAdmin = asyncHandler(async (req, res) => {
  const { page, limit, status, q } = req.query;
  const filter = {
    ...(status ? { status } : {}),
    ...(q ? { orderNumber: { $regex: q.trim(), $options: "i" } } : {}),
  };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name email"),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const getOrderAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone");
  if (!order) throw ApiError.notFound("Order not found");
  sendSuccess(res, { data: order });
});

export const updateOrderStatusAdmin = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, courierName } = req.body;
  const { order, previousStatus } = await transitionOrderStatus({
    orderId: req.params.id,
    newStatus: status,
    note,
    actorId: req.user.id,
    trackingNumber,
    courierName,
  });

  // The customer hears "confirmed" exactly when the order first moves out of
  // pending — not on packed→confirmed relabels or cancelled→confirmed
  // restores. Guests may have no email; that skips silently inside.
  if (shouldSendOrderConfirmedEmail({ previousStatus, newStatus: status })) {
    (async () => {
      const user = await User.findById(order.user).select("name email");
      if (user?.email) await sendOrderConfirmedEmail(order, user);
    })().catch((err) => console.error("Order confirmed email failed:", err.message));
  }

  sendSuccess(res, { data: order, message: "Order status updated" });
});

export const deleteOrdersAdmin = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const { deletedCount, unitsReturnedToStock } = await deleteOrders({ orderIds: ids, actorId: req.user.id });

  const stockNote = unitsReturnedToStock > 0 ? ` · ${unitsReturnedToStock} item(s) returned to stock` : "";
  sendSuccess(res, {
    data: { deletedCount, unitsReturnedToStock },
    message: `${deletedCount} order(s) deleted${stockNote}`,
  });
});
