import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    image: { url: String, cloudinaryId: String },
    description: { type: String, trim: true },
    // Landing-page depth for /category/<slug> — same design as Brand.content/
    // Brand.faqs; see the comment there (plan.md #91).
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

export const Category = mongoose.model("Category", categorySchema);
