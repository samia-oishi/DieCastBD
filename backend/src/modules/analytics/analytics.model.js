import mongoose from "mongoose";

const topProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    title: String,
    unitsSold: Number,
    revenue: Number,
    profit: Number,
  },
  { _id: false }
);

const analyticsDailySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true }, // "YYYY-MM-DD", UTC

  // See orderMetrics.js for the definitions. `revenue` keeps its name but its
  // MEANING changed with profit reporting: it is now net of the delivery
  // charge, where it used to be order.total. These rows are a derivation of the
  // orders collection and upsertDailyRollup is idempotent, so that redefinition
  // needs a recompute, not a schema migration.
  totalSales: { type: Number, default: 0 },
  shippingFees: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  cogs: { type: Number, default: 0 },
  unitsSold: { type: Number, default: 0 },
  // Units sold whose cost wasn't known, so profit for the day is understated
  // rather than silently wrong. Surfaced in the UI when non-zero.
  unitsMissingCost: { type: Number, default: 0 },

  ordersCount: { type: Number, default: 0 },
  newCustomers: { type: Number, default: 0 },
  topProducts: { type: [topProductSchema], default: [] },
  lowStockCount: { type: Number, default: 0 },
});

// profit is deliberately NOT stored — it is exactly revenue - cogs, and a
// stored copy is one more thing that can disagree with its own inputs.
analyticsDailySchema.virtual("profit").get(function () {
  return this.revenue - this.cogs;
});
analyticsDailySchema.set("toJSON", { virtuals: true });
analyticsDailySchema.set("toObject", { virtuals: true });

export const AnalyticsDaily = mongoose.model("AnalyticsDaily", analyticsDailySchema);
