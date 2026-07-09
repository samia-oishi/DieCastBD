import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import * as brandRoutes from "../modules/brands/brand.routes.js";
import * as categoryRoutes from "../modules/categories/category.routes.js";
import * as productRoutes from "../modules/products/product.routes.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
const requireAdmin = [authenticate, authorize("admin", "staff")];

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.use("/brands", brandRoutes.publicRouter);
router.use("/categories", categoryRoutes.publicRouter);
router.use("/products", productRoutes.publicRouter);

router.use("/admin/brands", ...requireAdmin, brandRoutes.adminRouter);
router.use("/admin/categories", ...requireAdmin, categoryRoutes.adminRouter);
router.use("/admin/products", ...requireAdmin, productRoutes.adminRouter);

// Further module routers mount here as each domain is built (Phase 4+).

export default router;
