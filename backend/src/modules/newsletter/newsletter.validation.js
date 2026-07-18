import { z } from "zod";

export const subscribeSchema = {
  body: z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
  }),
};

export const listSubscribersQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
    q: z.string().optional(),
  }),
};

export const subscriberIdParamSchema = {
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid subscriber id") }),
};
