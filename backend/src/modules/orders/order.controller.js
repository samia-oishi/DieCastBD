import { Order } from "./order.model.js";
import { Address } from "../addresses/address.model.js";
import { User } from "../users/user.model.js";
import { findOrCreateGuestUser } from "../users/user.service.js";
import { createOrderFromCart, createOrderFromItems, addItemsToOrder, transitionOrderStatus, deleteOrders } from "./order.service.js";
import { sendOrderConfirmationEmail } from "../../emails/orderConfirmation.js";
import { recomputeRollupsForOrders } from "../analytics/analytics.service.js";
import { applyOrderAdjustment, describeAdjustment } from "./orderAdjustment.js";
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
        district: address.district,
        thana: address.thana,
        // Carried over so an address saved before the district/thana switch
        // still snapshots a usable area onto the order.
        city: address.city,
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

/** Records money that arrived outside checkout, or a discount agreed in
 * conversation — the Facebook/Messenger case, where a customer sends part of
 * the payment by bKash before the parcel goes out.
 *
 * Deliberately does NOT touch subtotal, shippingFee or the items: an adjustment
 * describes money, not a re-order. `paymentOption` is also left alone — it
 * records which option was chosen at checkout, and the amountPaid/amountDue
 * pair already tells the truth about what has actually been collected.
 */
export const adjustOrderPaymentAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");
  if (["cancelled", "refunded"].includes(order.status)) {
    throw ApiError.conflict(`This order is ${order.status} — its payment can no longer be adjusted`);
  }

  const before = { discount: order.discount, total: order.total, amountPaid: order.amountPaid, amountDue: order.amountDue };

  let next;
  try {
    next = applyOrderAdjustment(order, {
      advanceReceived: req.body.advanceReceived,
      discount: req.body.discount,
    });
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }

  const summary = describeAdjustment(before, next, req.body.reason);
  if (!summary) return sendSuccess(res, { data: order, message: "Nothing to change" });

  Object.assign(order, next);
  // The order's own timeline is where a merchant looks to answer "why is this
  // number different from the invoice"; auditLog covers who/when separately.
  order.statusHistory.push({ status: order.status, note: summary, changedBy: req.user?.id, at: new Date() });
  await order.save();

  // The total moved, so this day's revenue and profit did too.
  await recomputeRollupsForOrders([order]);

  sendSuccess(res, { data: order, message: summary });
});

/** Looks up a customer by phone so an admin creating an order can reuse the
 * address they already delivered to.
 *
 * The address comes from the customer's most recent ORDER, not the Address
 * book: guest customers never get an Address document (their address lives only
 * as a snapshot on the order), and most people who message on Facebook check
 * out as guests. Reading the last order covers both kinds of customer with one
 * lookup and always reflects where the parcel actually went last time.
 *
 * Admin-only, behind the same auth as every other admin route. This is
 * deliberately NOT exposed to the storefront: a public phone-to-address lookup
 * cannot tell a returning customer from a stranger typing numbers, and would
 * hand anyone the home address behind any phone number they know.
 */
export const lookupCustomerAdmin = asyncHandler(async (req, res) => {
  const digits = String(req.query.phone ?? "").replace(/\D/g, "");
  if (digits.length < 6) throw ApiError.badRequest("Enter at least 6 digits of the phone number");

  // Search ORDERS, not users. The phone is captured at checkout and stored on
  // the order (and its address snapshot); the User record often has none at all
  // — a customer who signed in with Google has an email and no phone, and some
  // guest records carry an empty string. Matching on orders is also exactly the
  // question being asked: "has this number bought from us before?"
  //
  // Matched on the last 8+ digits so +880 / 880 / local forms all find the same
  // person, anchored at the end so a partial can't match mid-number.
  const tail = digits.slice(-10);
  const rx = new RegExp(`${tail}$`);
  const order = await Order.findOne({ $or: [{ phone: rx }, { "shippingAddress.phone": rx }] })
    .sort({ createdAt: -1 })
    .select("phone shippingAddress user createdAt")
    .populate("user", "name email phone");

  if (!order) return sendSuccess(res, { data: null, message: "No previous order from that number" });

  const orderCount = await Order.countDocuments({
    $or: [{ phone: rx }, { "shippingAddress.phone": rx }],
  });

  sendSuccess(res, {
    data: {
      customer: {
        id: order.user?._id ?? null,
        // The address snapshot's recipient name is the one that was actually
        // delivered to, which beats an account display name here.
        name: order.shippingAddress?.recipientName || order.user?.name || "",
        email: order.user?.email ?? "",
        phone: order.shippingAddress?.phone || order.phone,
      },
      lastAddress: order.shippingAddress ?? null,
      lastOrderAt: order.createdAt,
      orderCount,
    },
  });
});

/** Creates an order on the customer's behalf — for the ones that arrive by
 * Facebook, Messenger or phone rather than through checkout.
 *
 * Reuses createOrderFromItems rather than writing a second creation path, so
 * stock reservation, price snapshotting, cost snapshotting and the money math
 * are literally the same code the storefront runs. A parallel implementation
 * here is exactly how an admin-placed order would quietly stop reserving stock
 * or stop recording costPrice.
 *
 * Sequence matters: create (pending, stock reserved) → apply any advance or
 * discount → confirm. Confirming goes through transitionOrderStatus so stock
 * moves reserved → committed through the same state machine as every other
 * confirmation, and the analytics recompute fires with the FINAL figures.
 */
export const createOrderAdmin = asyncHandler(async (req, res) => {
  const { customer, shippingAddress, items, shippingZone, deliveryNote, advanceReceived, discount, reason } = req.body;

  // Prefer the customer the lookup resolved. findOrCreateGuestUser matches on
  // email then User.phone, but the lookup finds people through their ORDERS —
  // and a customer who signed in with Google has no phone on their User record
  // at all. Without this, creating an order for a returning customer whose
  // address we just autofilled would silently mint a SECOND customer record,
  // splitting their order history in two.
  let user = customer.id ? await User.findById(customer.id) : null;
  if (user && !user.phone && customer.phone) {
    // Backfill the number we now know, so the next lookup matches directly.
    user.phone = customer.phone;
    await user.save();
  }
  if (!user) {
    user = await findOrCreateGuestUser({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
    });
  }

  let order = await createOrderFromItems({
    userId: user._id,
    items,
    shippingAddress,
    phone: customer.phone,
    deliveryNote,
    paymentMethod: "cod",
    paymentOption: "cod",
    shippingZone,
    // The merchant sells over Messenger and Facebook, where the terms are
    // agreed in the conversation before this form is ever opened. The
    // storefront's per-product prepay rules would refuse those orders outright
    // — a "full payment only" model could not be entered as COD even when the
    // customer had already paid — so an admin-entered order is exempt. What was
    // actually received is recorded below as advanceReceived, which is the
    // honest record; the rules protect customers from unoffered terms, and
    // there is no customer to protect from the merchant's own agreement.
    enforcePaymentRules: false,
  });

  // Money agreed in conversation — an advance already sent, a deal struck.
  if (advanceReceived || discount) {
    const next = applyOrderAdjustment(order, { advanceReceived, discount });
    const summary = describeAdjustment(
      { discount: order.discount, total: order.total, amountPaid: order.amountPaid },
      next,
      reason
    );
    Object.assign(order, next);
    if (summary) order.statusHistory.push({ status: order.status, note: summary, changedBy: req.user.id, at: new Date() });
    await order.save();
  }

  // Confirmed on creation (merchant's call): an order they entered themselves
  // is already accepted, so stock commits and it counts as revenue at once.
  const transitioned = await transitionOrderStatus({
    orderId: order._id,
    newStatus: "confirmed",
    note: "Created from the admin",
    actorId: req.user.id,
  });
  order = transitioned.order;

  if (user.email) {
    sendOrderConfirmationEmail(order, user).catch((err) =>
      console.error("Admin order confirmation email failed:", err.message)
    );
  }

  sendSuccess(res, { data: order, status: 201, message: `Order ${order.orderNumber} created` });
});

/** Admin adds products to an existing order.
 *
 * Stock, money and the analytics recompute all happen in addItemsToOrder — the
 * controller's whole job is to hand it the actor, so the inventory log and the
 * order's own timeline record who did it. */
export const addOrderItemsAdmin = asyncHandler(async (req, res) => {
  const { order, summary } = await addItemsToOrder({
    orderId: req.params.id,
    items: req.body.items,
    actorId: req.user.id,
  });
  sendSuccess(res, { data: order, message: summary });
});
