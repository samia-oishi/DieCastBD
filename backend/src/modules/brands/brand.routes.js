import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { upload } from "../../middlewares/upload.js";
import { createBrandSchema, updateBrandSchema, idParamSchema } from "./brand.validation.js";
import {
  listActiveBrands,
  listAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandLogo,
} from "./brand.controller.js";
import { Brand } from "./brand.model.js";

export const publicRouter = Router();
publicRouter.get("/", listActiveBrands);

export const adminRouter = Router();
adminRouter.get("/", listAllBrands);
adminRouter.post("/", validate(createBrandSchema), auditLog("Brand"), createBrand);
adminRouter.patch("/:id", validate(updateBrandSchema), auditLog("Brand", Brand), updateBrand);
adminRouter.delete("/:id", validate(idParamSchema), auditLog("Brand", Brand), deleteBrand);
adminRouter.post("/:id/logo", validate(idParamSchema), upload.single("image"), auditLog("Brand", Brand), uploadBrandLogo);
