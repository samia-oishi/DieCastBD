import { z } from "zod";

export const listProductsQuerySchema = {
  query: z.object({
    brand: z.string().optional(),
    category: z.string().optional(),
    series: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    inStock: z.coerce.boolean().optional(),
    featured: z.coerce.boolean().optional(),
    hero: z.coerce.boolean().optional(),
    newArrival: z.coerce.boolean().optional(),
    sort: z.enum(["newest", "price-asc", "price-desc", "title-asc"]).optional().default("newest"),
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(24),
  }),
};

// Admin list = the public query shape plus a status filter (the storefront list
// is hardcoded to active, so status stays off the public schema).
export const listProductsAdminQuerySchema = {
  query: listProductsQuerySchema.query.extend({
    status: z.enum(["draft", "active", "archived"]).optional(),
  }),
};

export const slugParamSchema = {
  params: z.object({ slug: z.string().min(1) }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

// Bulk actions from the admin list. ids capped at 100 per call.
const bulkIds = z
  .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product id"))
  .min(1, "Select at least one product")
  .max(100, "At most 100 products at a time");

export const bulkStatusSchema = {
  body: z.object({ ids: bulkIds, status: z.enum(["active", "draft"]) }),
};

export const bulkDeleteSchema = {
  body: z.object({ ids: bulkIds }),
};

const productFields = {
  sku: z.string().min(1, "SKU is required"),
  title: z.string().min(1, "Title is required"),
  brand: z.string().min(1, "Brand is required"),
  category: z.array(z.string()).optional().default([]),
  manufacturer: z.string().optional(),
  series: z.string().optional(),
  modelNumber: z.string().optional(),
  scale: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  salePrice: z.coerce.number().min(0).nullable().optional(),
  costPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(["draft", "active", "archived"]).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isHeroProduct: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  isPreOrder: z.coerce.boolean().optional(),
  preOrderStartDate: z.coerce.date().optional().nullable(),
  preOrderEndDate: z.coerce.date().optional().nullable(),
  paymentOptions: z
    .array(z.enum(["cod", "deliveryOnly", "partialAdvance", "full"]))
    .min(1, "Select at least one payment option")
    .optional()
    .default(["cod", "full"]),
  advancePaymentPercent: z.coerce.number().min(1).max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
};

// Cross-field rules that apply to both create and update — kept as one
// wrapper so later phases can extend this chain in one place instead of
// duplicating refines across both schemas.
function withProductRefinements(schema) {
  return schema
    .refine(
      (data) => !data.preOrderStartDate || !data.preOrderEndDate || data.preOrderEndDate >= data.preOrderStartDate,
      { message: "Pre-order end date must be on or after the start date", path: ["preOrderEndDate"] }
    )
    .refine(
      (data) =>
        !data.paymentOptions?.includes("partialAdvance") ||
        (data.advancePaymentPercent != null && data.advancePaymentPercent >= 1 && data.advancePaymentPercent <= 100),
      {
        message: "Advance payment percent (1-100) is required when Partial Advance Payment is enabled",
        path: ["advancePaymentPercent"],
      }
    )
    .refine((data) => !(data.paymentOptions?.includes("cod") && data.paymentOptions?.includes("partialAdvance")), {
      message: "Cash on Delivery and Partial Advance Payment cannot both be enabled",
      path: ["paymentOptions"],
    });
}

export const createProductSchema = {
  body: withProductRefinements(z.object(productFields)),
};

export const updateProductSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: withProductRefinements(
    z.object(Object.fromEntries(Object.entries(productFields).map(([key, schema]) => [key, schema.optional()])))
  ),
};

export const galleryIndexParamSchema = {
  params: z.object({ id: z.string().min(1), index: z.coerce.number().int().min(0) }),
};
