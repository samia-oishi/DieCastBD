import mongoose from "mongoose";

const seoSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    canonicalUrl: String,
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    // Sanitized server-side on save (page.controller.js) before it's ever
    // persisted — admin-authored rich text is still untrusted input, and this
    // is rendered with dangerouslySetInnerHTML on the public page.
    content: { type: String, default: "" },
    // Optional "the short version" summary shown as a TL;DR card above the body
    // (policy pages). Plain text, newline-separated bullet lines.
    tldr: { type: String, default: "" },
    // Block-built page body. Structured data, not markup — the storefront
    // renders each block as React elements, so unlike `content` there is no
    // HTML to sanitize. Shape is validated by Zod at the API boundary
    // (page.blocks.js); Mixed here keeps the eight block shapes in one array.
    blocks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    seo: { type: seoSchema, default: () => ({}) },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Page = mongoose.model("Page", pageSchema);
