import mongoose from "mongoose";

const restockAlertSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    // Either an email or a BD phone number, as typed — validated in
    // restockAlert.validation.js, not here. No SMS provider exists, so only
    // email-shaped contacts are ever auto-notified (see inventory.controller.js);
    // phone-shaped ones surface to the admin for manual follow-up instead.
    contact: { type: String, required: true, trim: true, lowercase: true },
    // Set once this contact has actually been emailed after a restock — kept
    // (not deleted) as a record of who was notified, and to filter the admin's
    // still-waiting list.
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Same contact can't double-subscribe to the same product — a second POST for
// an existing pair is treated as a no-op success, not an error (see controller).
restockAlertSchema.index({ product: 1, contact: 1 }, { unique: true });

export const RestockAlert = mongoose.model("RestockAlert", restockAlertSchema);
