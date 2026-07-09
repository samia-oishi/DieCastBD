import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import * as brandRoutes from "../modules/brands/brand.routes.js";
import * as categoryRoutes from "../modules/categories/category.routes.js";
import * as productRoutes from "../modules/products/product.routes.js";
import * as settingsRoutes from "../modules/settings/settings.routes.js";
import newsletterRoutes from "../modules/newsletter/newsletter.routes.js";
import wishlistRoutes from "../modules/wishlists/wishlist.routes.js";
import cartRoutes from "../modules/cart/cart.routes.js";
import addressRoutes from "../modules/addresses/address.routes.js";
import couponRoutes from "../modules/coupons/coupon.routes.js";
import * as orderRoutes from "../modules/orders/order.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
const requireAdmin = [authenticate, authorize("admin", "staff")];

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.use("/brands", brandRoutes.publicRouter);
router.use("/categories", categoryRoutes.publicRouter);
router.use("/products", productRoutes.publicRouter);
router.use("/settings", settingsRoutes.publicRouter);
router.use("/newsletter", newsletterRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/coupons", couponRoutes);
router.use("/orders", orderRoutes.customerRouter);

router.use("/admin/brands", ...requireAdmin, brandRoutes.adminRouter);
router.use("/admin/categories", ...requireAdmin, categoryRoutes.adminRouter);
router.use("/admin/products", ...requireAdmin, productRoutes.adminRouter);
router.use("/admin/settings", ...requireAdmin, settingsRoutes.adminRouter);
router.use("/admin/orders", ...requireAdmin, orderRoutes.adminRouter);
router.use("/admin/analytics", ...requireAdmin, analyticsRoutes);

// Further module routers mount here as each domain is built (Phase 10+).

export default router;
