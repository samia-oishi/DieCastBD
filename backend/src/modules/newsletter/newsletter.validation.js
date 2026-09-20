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

export const listAudienceQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    // Higher ceiling than the subscriber list: the audience is a union of four
    // sources, so one "page" of it legitimately covers more people.
    limit: z.coerce.number().int().min(1).max(500).optional().default(50),
    source: z.enum(["all", "newsletter", "customer", "order", "notify"]).optional().default("all"),
    q: z.string().optional(),
  }),
};

export const subscriberIdParamSchema = {
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid subscriber id") }),
};
