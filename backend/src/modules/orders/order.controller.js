import { Order } from "./order.model.js";
import { Address } from "../addresses/address.model.js";
import { User } from "../users/user.model.js";
import { findOrCreateGuestUser } from "../users/user.service.js";
import { createOrderFromCart, createOrderFromItems, transitionOrderStatus } from "./order.service.js";
import { sendOrderConfirmationEmail } from "../../emails/orderConfirmation.js";
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
  const order = await transitionOrderStatus({
    orderId: req.params.id,
    newStatus: status,
    note,
    actorId: req.user.id,
    trackingNumber,
    courierName,
  });
  sendSuccess(res, { data: order, message: "Order status updated" });
});
