import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { upload } from "../../middlewares/upload.js";
import { createBrandSchema, updateBrandSchema, idParamSchema, reorderSchema } from "./brand.validation.js";
import {
  listPublicBrands,
  listAllBrands,
  reorderBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandLogo,
} from "./brand.controller.js";
import { Brand } from "./brand.model.js";

export const publicRouter = Router();
publicRouter.get("/", listPublicBrands);

export const adminRouter = Router();
adminRouter.get("/", listAllBrands);
adminRouter.post("/", validate(createBrandSchema), auditLog("Brand"), createBrand);
// BEFORE "/:id" — Express matches in declaration order, and "/:id" would
// happily swallow "/reorder" and try to update a brand with that id.
adminRouter.patch("/reorder", validate(reorderSchema), auditLog("Brand"), reorderBrands);
adminRouter.patch("/:id", validate(updateBrandSchema), auditLog("Brand", Brand), updateBrand);
adminRouter.delete("/:id", validate(idParamSchema), auditLog("Brand", Brand), deleteBrand);
adminRouter.post("/:id/logo", validate(idParamSchema), upload.single("image"), auditLog("Brand", Brand), uploadBrandLogo);
