import { z } from "zod";

export const listProductsQuerySchema = {
  query: z.object({
    brand: z.string().optional(),
    category: z.string().optional(),
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

export const slugParamSchema = {
  params: z.object({ slug: z.string().min(1) }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
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
  tags: z.array(z.string()).optional(),
};

export const createProductSchema = {
  body: z.object(productFields),
};

export const updateProductSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object(
    Object.fromEntries(Object.entries(productFields).map(([key, schema]) => [key, schema.optional()]))
  ),
};

export const galleryIndexParamSchema = {
  params: z.object({ id: z.string().min(1), index: z.coerce.number().int().min(0) }),
};
