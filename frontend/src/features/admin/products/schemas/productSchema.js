import { z } from "zod";

export const productSchema = z
  .object({
    sku: z.string().min(1, "SKU is required"),
    title: z.string().min(1, "Title is required"),
    brand: z.string().min(1, "Brand is required"),
    category: z.array(z.string()).optional().default([]),
    manufacturer: z.string().optional().or(z.literal("")),
    series: z.string().optional().or(z.literal("")),
    modelNumber: z.string().optional().or(z.literal("")),
    scale: z.string().optional().or(z.literal("")),
    material: z.string().optional().or(z.literal("")),
    color: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    price: z.coerce.number().min(0, "Price must be positive"),
    salePrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
    costPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
    stock: z.coerce.number().int().min(0),
    status: z.enum(["draft", "active", "archived"]),
    isFeatured: z.boolean().optional(),
    isHeroProduct: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isPreOrder: z.boolean().optional(),
    preOrderStartDate: z.string().optional().or(z.literal("")),
    preOrderEndDate: z.string().optional().or(z.literal("")),
    paymentOptions: z
      .array(z.enum(["cod", "deliveryOnly", "partialAdvance", "full"]))
      .min(1, "Select at least one payment option"),
    advancePaymentPercent: z.union([z.coerce.number().min(1).max(100), z.literal("")]).optional(),
  })
  // Mirrors backend product.validation.js's withProductRefinements — kept in sync manually
  // since the frontend schema is a client-side preview, the server stays authoritative.
  .refine(
    (data) =>
      !data.paymentOptions?.includes("partialAdvance") ||
      (data.advancePaymentPercent !== "" && data.advancePaymentPercent != null),
    {
      message: "Advance payment percent (1-100) is required when Partial Advance Payment is enabled",
      path: ["advancePaymentPercent"],
    }
  )
  .refine((data) => !(data.paymentOptions?.includes("cod") && data.paymentOptions?.includes("partialAdvance")), {
    message: "Cash on Delivery and Partial Advance Payment cannot both be enabled",
    path: ["paymentOptions"],
  });
