import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { upload } from "../../middlewares/upload.js";
import { createCategorySchema, updateCategorySchema, idParamSchema } from "./category.validation.js";
import {
  listActiveCategories,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "./category.controller.js";
import { Category } from "./category.model.js";

export const publicRouter = Router();
publicRouter.get("/", listActiveCategories);

export const adminRouter = Router();
adminRouter.get("/", listAllCategories);
adminRouter.post("/", validate(createCategorySchema), auditLog("Category"), createCategory);
adminRouter.patch("/:id", validate(updateCategorySchema), auditLog("Category", Category), updateCategory);
adminRouter.delete("/:id", validate(idParamSchema), auditLog("Category", Category), deleteCategory);
adminRouter.post(
  "/:id/image",
  validate(idParamSchema),
  upload.single("image"),
  auditLog("Category", Category),
  uploadCategoryImage
);
