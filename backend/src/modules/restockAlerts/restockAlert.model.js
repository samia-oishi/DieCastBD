import mongoose from "mongoose";

const restockAlertSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    // Set once an admin restock/adjustment brings the product back in stock and
    // the alert is actioned — kept (not deleted) as a record of who was notified.
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Same email can't double-subscribe to the same product — a second POST for an
// existing pair is treated as a no-op success, not an error (see controller).
restockAlertSchema.index({ product: 1, email: 1 }, { unique: true });

export const RestockAlert = mongoose.model("RestockAlert", restockAlertSchema);
