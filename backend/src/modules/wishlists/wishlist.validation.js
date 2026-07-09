import { z } from "zod";

export const productIdParamSchema = {
  params: z.object({ productId: z.string().min(1) }),
};
