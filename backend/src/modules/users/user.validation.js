import { z } from "zod";

export const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.union([z.string().min(1), z.literal("")]).optional(),
    photoURL: z.string().url().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

export const listUsersQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    q: z.string().optional(),
    role: z.enum(["customer", "staff", "admin"]).optional(),
    isActive: z.coerce.boolean().optional(),
    isGuest: z.coerce.boolean().optional(),
  }),
};

export const updateUserAdminSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.union([z.string().min(1), z.literal("")]).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const changeRoleSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    role: z.enum(["customer", "staff", "admin"]),
  }),
};
