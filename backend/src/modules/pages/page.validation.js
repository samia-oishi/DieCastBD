import { z } from "zod";
import { blocksSchema } from "./page.blocks.js";

const seo = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonicalUrl: z.string().optional(),
});

export const createPageSchema = {
  body: z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
    tldr: z.string().optional(),
    blocks: blocksSchema.optional(),
    seo: seo.optional(),
    isPublished: z.coerce.boolean().optional(),
  }),
};

export const updatePageSchema = {
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid page id") }),
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    tldr: z.string().optional(),
    blocks: blocksSchema.optional(),
    seo: seo.optional(),
    isPublished: z.coerce.boolean().optional(),
  }),
};

export const idParamSchema = {
  // Must be a real ObjectId, not just any non-empty string: a malformed id used
  // to reach Mongoose and throw a CastError, which surfaced as a 500 instead of
  // a 400. Applies to GET/PATCH/DELETE, all of which share this schema.
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid page id") }),
};

export const slugParamSchema = {
  params: z.object({ slug: z.string().min(1) }),
};
