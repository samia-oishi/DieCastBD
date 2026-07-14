import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
  },
  { _id: false }
);

const seoSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    canonicalUrl: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },

    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    manufacturer: { type: String, trim: true },
    series: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    scale: { type: String, trim: true },
    material: { type: String, trim: true },
    color: { type: String, trim: true },

    description: { type: String, trim: true },
    features: [{ type: String, trim: true }],
    specifications: { type: Map, of: String },

    thumbnail: { type: imageSchema, default: null },
    gallery: { type: [imageSchema], default: [] },

    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    costPrice: { type: Number, min: 0, select: false },

    stock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, min: 0, default: 0 },

    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    isFeatured: { type: Boolean, default: false },
    isHeroProduct: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },

    isPreOrder: { type: Boolean, default: false },
    preOrderStartDate: { type: Date, default: null },
    preOrderEndDate: { type: Date, default: null },

    // Default preserves today's only behavior (COD or full payment) for every
    // existing product — this array is purely additive. "cod" and
    // "partialAdvance" are mutually exclusive, enforced in product.validation.js.
    paymentOptions: {
      type: [String],
      enum: ["cod", "deliveryOnly", "partialAdvance", "full"],
      default: ["cod", "full"],
    },
    // 1-100, required only when "partialAdvance" is in paymentOptions (see
    // product.validation.js refine); null otherwise.
    advancePaymentPercent: { type: Number, min: 1, max: 100, default: null },

    tags: [{ type: String, trim: true, lowercase: true }],
    seo: { type: seoSchema, default: () => ({}) },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.virtual("availableStock").get(function () {
  return this.stock - this.reservedStock;
});

// Margin off the *effective* selling price — salePrice when one is active,
// otherwise list price — so a discounted item's margin reflects what it's
// actually selling for, not its pre-discount list price. Same "is this item
// on sale" check used everywhere else (ProductCard, PDP, order.service.js).
// null (not 0) when costPrice isn't set/selected, since 0% margin and
// "unknown" are different things an admin needs to tell apart. costPrice is
// select:false by default, so this only resolves on admin queries that
// explicitly .select("+costPrice").
productSchema.virtual("profitMargin").get(function () {
  if (this.costPrice == null || !this.price) return null;
  const effectivePrice = this.salePrice != null && this.salePrice < this.price ? this.salePrice : this.price;
  if (!effectivePrice) return null;
  return Math.round(((effectivePrice - this.costPrice) / effectivePrice) * 100);
});

// True only while a pre-order window is actually open — auto-expires once
// preOrderEndDate passes, with no cron/admin action needed, same "derive at
// read time" philosophy as availableStock/profitMargin above. Badges/CTAs on
// the frontend key off this, not the raw isPreOrder flag.
productSchema.virtual("isPreOrderActive").get(function () {
  return Boolean(this.isPreOrder) && (!this.preOrderEndDate || this.preOrderEndDate >= new Date());
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.index({ brand: 1, category: 1 });
productSchema.index({ title: "text", description: "text", tags: "text" });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isHeroProduct: 1 });
productSchema.index({ status: 1, isDeleted: 1 });
productSchema.index({ price: 1 });
productSchema.index({ series: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ createdAt: -1 });

export const Product = mongoose.model("Product", productSchema);
