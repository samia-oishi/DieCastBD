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

    tags: [{ type: String, trim: true, lowercase: true }],
    seo: { type: seoSchema, default: () => ({}) },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.virtual("availableStock").get(function () {
  return this.stock - this.reservedStock;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.index({ brand: 1, category: 1 });
productSchema.index({ title: "text", description: "text", tags: "text" });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isHeroProduct: 1 });
productSchema.index({ status: 1, isDeleted: 1 });

export const Product = mongoose.model("Product", productSchema);
