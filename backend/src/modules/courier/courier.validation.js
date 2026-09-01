import { z } from "zod";

export const orderIdParamSchema = {
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order id") }),
};

export const syncSchema = {
  body: z.object({
    // Capped at one page of the admin list. An unbounded list would mean an
    // unbounded number of upstream calls from a single request.
    ids: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order id"))
      .min(1, "Nothing to sync")
      .max(100, "You can sync at most 100 orders at a time"),
  }),
};

/** Linking a consignment created directly in Steadfast's panel. */
export const linkSchema = {
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order id") }),
  body: z.object({
    consignmentId: z.string().trim().min(1, "Enter the consignment ID from Steadfast").max(32),
    trackingCode: z.string().trim().max(64).optional(),
  }),
};
