import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: { type: String, enum: ["restock", "sale", "reservation", "release", "adjustment"], required: true },
    quantityChange: { type: Number, required: true }, // signed: negative for sale/reservation, positive for restock/release
    reason: { type: String },
    referenceOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = system (e.g. reservation on checkout)
  },
  { timestamps: true }
);

inventoryLogSchema.index({ product: 1, createdAt: -1 });

export const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);
