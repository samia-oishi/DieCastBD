import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    logo: { url: String, cloudinaryId: String },
    description: { type: String, trim: true },
    // Landing-page depth for /brand/<slug> — the pages built to rank for
    // "<brand> price in bangladesh"-class queries (plan.md #91). `content` is
    // sanitized Tiptap HTML rendered below the product grid; `faqs` render as
    // an on-page FAQ section and feed FAQPage JSON-LD only when non-empty.
    // Both default empty and render nothing until the merchant writes real
    // copy — never seeded, never fabricated.
    content: { type: String, default: "" },
    faqs: [
      new mongoose.Schema(
        { question: { type: String, trim: true }, answer: { type: String, trim: true } },
        { _id: false }
      ),
    ],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Brand = mongoose.model("Brand", brandSchema);
