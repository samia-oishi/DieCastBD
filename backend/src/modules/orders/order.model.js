import mongoose from "mongoose";

// Snapshotted at purchase time — deliberately NOT a live ref-and-populate,
// so later product edits/price changes/deletion never corrupt order history.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true },
    title: { type: String, required: true },
    thumbnail: { url: String, cloudinaryId: String },
    price: { type: Number, required: true },
    // What the item cost US at purchase time — the other half of the snapshot,
    // and the whole basis of profit reporting. Deliberately stored rather than
    // read live off the Product: editing a cost price must not silently rewrite
    // last month's profit, exactly as editing a price must not rewrite what a
    // customer was charged. Null for orders placed before profit reporting
    // existed and for any product with no cost recorded — analytics reports
    // that as "cost unknown" rather than treating it as free stock.
    costPrice: { type: Number, default: null },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    district: String,
    thana: String,
    // Pre-dropdown checkout collected a free-text city and postcode instead of
    // district+thana. Kept (and no longer required) so orders placed then still
    // load and print; nothing writes them any more.
    city: String,
    postalCode: String,
  },
  { _id: false }
);

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    phone: { type: String, required: true },
    deliveryNote: { type: String, trim: true },

    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    couponCode: { type: String, default: null }, // snapshotted so it still displays if the coupon is later deleted

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, required: true },
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: ["cod", "bkash", "banglaqr"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    bkashTransactionId: { type: String, default: null },
    banglaQrReference: { type: String, default: null },

    // Business payment option selected at checkout (System: pre-order/payment-options
    // requirement) — orthogonal to paymentMethod, which stays the payment *channel*
    // (cod/bkash/banglaqr). Computed once at order-creation time by
    // paymentPlan.service.js (calculateAmountPaid) and snapshotted here so a later
    // product config change never rewrites historical order numbers.
    paymentOption: {
      type: String,
      enum: ["cod", "deliveryOnly", "partialAdvance", "full"],
      // Function defaults below exist solely to backfill a semantically-correct
      // value for pre-Phase-4 historical orders with no migration script: back
      // then paymentMethod was the only payment signal available, so that's what
      // gets reconstructed when an old document is read without this field stored.
      default: function () {
        return this.paymentMethod === "cod" ? "cod" : "full";
      },
    },
    advancePaymentPercent: { type: Number, min: 1, max: 100, default: null },
    // amountPaid + amountDue === total is a hard invariant, enforced by
    // calculateAmountPaid for every order created from Phase 4 onward. Same
    // historical-backfill reasoning as paymentOption above: "cod" meant nothing
    // was paid upfront, "bkash"/"banglaqr" meant the full amount was already
    // collected via the pre-existing manual-proof flow.
    amountPaid: {
      type: Number,
      default: function () {
        return this.paymentMethod === "cod" ? 0 : this.total;
      },
    },
    amountDue: {
      type: Number,
      default: function () {
        return this.paymentMethod === "cod" ? this.total : 0;
      },
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    statusHistory: { type: [statusHistoryEntrySchema], default: [] },
    trackingNumber: { type: String, default: null },
    courierName: { type: String, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
