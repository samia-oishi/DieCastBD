import mongoose from "mongoose";

const topProductSchema = new mongoose.Schema(
  { product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, title: String, unitsSold: Number },
  { _id: false }
);

const analyticsDailySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true }, // "YYYY-MM-DD", UTC
  revenue: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 },
  newCustomers: { type: Number, default: 0 },
  topProducts: { type: [topProductSchema], default: [] },
  lowStockCount: { type: Number, default: 0 },
});

export const AnalyticsDaily = mongoose.model("AnalyticsDaily", analyticsDailySchema);
