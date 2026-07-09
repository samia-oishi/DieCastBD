import { z } from "zod";

export const sessionSchema = {
  body: z.object({
    idToken: z.string().min(1, "idToken is required"),
  }),
};
