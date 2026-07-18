import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import { upload } from "../../middlewares/upload.js";
import {
  listProductsQuerySchema,
  listProductsAdminQuerySchema,
  slugParamSchema,
  idParamSchema,
  createProductSchema,
  updateProductSchema,
  galleryIndexParamSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
} from "./product.validation.js";
import {
  listProducts,
  getFilterOptions,
  getProductBySlug,
  getRelatedProducts,
  listProductsAdmin,
  getProductAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProductStatus,
  bulkDeleteProducts,
  uploadThumbnail,
  addGalleryImages,
  deleteGalleryImage,
} from "./product.controller.js";
import { Product } from "./product.model.js";

export const publicRouter = Router();
publicRouter.get("/", validate(listProductsQuerySchema), listProducts);
publicRouter.get("/filter-options", getFilterOptions); // must precede /:slug or it'd be swallowed as a slug lookup
publicRouter.get("/:slug", validate(slugParamSchema), getProductBySlug);
publicRouter.get("/:slug/related", validate(slugParamSchema), getRelatedProducts);

export const adminRouter = Router();
adminRouter.get("/", validate(listProductsAdminQuerySchema), listProductsAdmin);
// Bulk routes are declared before "/:id" so their literal paths aren't captured
// as an id. They audit per-product internally (see the controller), so no
// auditLog() middleware here.
adminRouter.patch("/bulk-status", validate(bulkStatusSchema), bulkUpdateProductStatus);
adminRouter.delete("/", validate(bulkDeleteSchema), bulkDeleteProducts);
adminRouter.get("/:id", validate(idParamSchema), getProductAdmin);
adminRouter.post("/", validate(createProductSchema), auditLog("Product"), createProduct);
adminRouter.patch("/:id", validate(updateProductSchema), auditLog("Product", Product), updateProduct);
adminRouter.delete("/:id", validate(idParamSchema), auditLog("Product", Product), deleteProduct);
adminRouter.post(
  "/:id/thumbnail",
  validate(idParamSchema),
  upload.single("image"),
  auditLog("Product", Product),
  uploadThumbnail
);
adminRouter.post(
  "/:id/gallery",
  validate(idParamSchema),
  upload.array("images", 10),
  auditLog("Product", Product),
  addGalleryImages
);
adminRouter.delete(
  "/:id/gallery/:index",
  validate(galleryIndexParamSchema),
  auditLog("Product", Product),
  deleteGalleryImage
);
