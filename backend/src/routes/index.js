import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import * as userRoutes from "../modules/users/user.routes.js";
import * as brandRoutes from "../modules/brands/brand.routes.js";
import * as categoryRoutes from "../modules/categories/category.routes.js";
import * as productRoutes from "../modules/products/product.routes.js";
import * as settingsRoutes from "../modules/settings/settings.routes.js";
import * as newsletterRoutes from "../modules/newsletter/newsletter.routes.js";
import contactRoutes from "../modules/contact/contact.routes.js";
import wishlistRoutes from "../modules/wishlists/wishlist.routes.js";
import cartRoutes from "../modules/cart/cart.routes.js";
import addressRoutes from "../modules/addresses/address.routes.js";
import * as couponRoutes from "../modules/coupons/coupon.routes.js";
import * as orderRoutes from "../modules/orders/order.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import inventoryRoutes from "../modules/inventory/inventory.routes.js";
import courierRoutes from "../modules/courier/courier.routes.js";
import * as pageRoutes from "../modules/pages/page.routes.js";
import * as restockAlertRoutes from "../modules/restockAlerts/restockAlert.routes.js";
import cronRoutes from "../modules/cron/cron.routes.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { cacheControl } from "../middlewares/cacheControl.js";

const router = Router();
const requireAdmin = [authenticate, authorize("admin", "staff")];

router.use("/auth", authRoutes);
router.use("/users", userRoutes.customerRouter);

// Public catalog reads change infrequently (admin-managed) — short cache
// windows let browsers/CDN skip a DB round trip on repeat views. Products get
// a shorter TTL since price/stock changes there matter more to a shopper.
router.use("/brands", cacheControl(300), brandRoutes.publicRouter);
router.use("/categories", cacheControl(300), categoryRoutes.publicRouter);
router.use("/products", cacheControl(60), productRoutes.publicRouter);
router.use("/products", restockAlertRoutes.publicRouter);
// Settings is the one "catalog" doc the merchant edits and immediately checks:
// a blind 5-minute max-age meant a saved hero style visibly reverted in the
// admin (the refetch after PATCH was served from the browser's HTTP cache) and
// the storefront showed the old hero for up to 5 minutes. no-cache keeps the
// ETag revalidation (304s are cheap) but always confirms freshness.
router.use("/settings", (req, res, next) => { res.set("Cache-Control", "no-cache"); next(); }, settingsRoutes.publicRouter);
router.use("/newsletter", newsletterRoutes.publicRouter);
router.use("/contact", contactRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/coupons", couponRoutes.publicRouter);
router.use("/orders", orderRoutes.customerRouter);
router.use("/pages", pageRoutes.publicRouter);

// Invoked by Vercel Cron over HTTP (self-guarded by CRON_SECRET) since node-cron
// has no persistent process on serverless. See src/jobs/scheduler.js for the
// equivalent in-process schedule used when self-hosting.
router.use("/cron", cronRoutes);

router.use("/admin/brands", ...requireAdmin, brandRoutes.adminRouter);
router.use("/admin/categories", ...requireAdmin, categoryRoutes.adminRouter);
router.use("/admin/products", ...requireAdmin, productRoutes.adminRouter);
router.use("/admin/settings", ...requireAdmin, settingsRoutes.adminRouter);
router.use("/admin/orders", ...requireAdmin, orderRoutes.adminRouter);
router.use("/admin/analytics", ...requireAdmin, analyticsRoutes);
router.use("/admin/users", ...requireAdmin, userRoutes.adminRouter);
router.use("/admin/coupons", ...requireAdmin, couponRoutes.adminRouter);
router.use("/admin/inventory", ...requireAdmin, inventoryRoutes);
router.use("/admin/courier", ...requireAdmin, courierRoutes);
router.use("/admin/inventory", ...requireAdmin, restockAlertRoutes.adminRouter);
router.use("/admin/newsletter", ...requireAdmin, newsletterRoutes.adminRouter);
router.use("/admin/pages", ...requireAdmin, pageRoutes.adminRouter);

// Further module routers mount here as each domain is built (Phase 11+).

export default router;
