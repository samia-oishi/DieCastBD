import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Further module routers mount here as each domain is built (Phase 3+), e.g.:
// router.use("/products", productRoutes);

export default router;
