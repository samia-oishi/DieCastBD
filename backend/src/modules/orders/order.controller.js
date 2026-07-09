import { Order } from "./order.model.js";
import { Address } from "../addresses/address.model.js";
import { User } from "../users/user.model.js";
import { createOrderFromCart, transitionOrderStatus } from "./order.service.js";
import { sendOrderConfirmationEmail } from "../../emails/orderConfirmation.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, phone, deliveryNote, couponCode, paymentMethod } = req.body;

  const address = await Address.findOne({ _id: addressId, user: req.user.id });
  if (!address) throw ApiError.notFound("Shipping address not found");

  const order = await createOrderFromCart({
    userId: req.user.id,
    shippingAddress: {
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
    },
    phone,
    deliveryNote,
    couponCode,
    paymentMethod,
  });

  // req.user is the minimal JWT payload ({id, role}) — the email needs name/email,
  // which the token deliberately doesn't carry, so fetch the real record here.
  User.findById(req.user.id)
    .select("name email")
    .then((user) => sendOrderConfirmationEmail(order, user))
    .catch((err) => console.error("Order confirmation email failed:", err.message));

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
