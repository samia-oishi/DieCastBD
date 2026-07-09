import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { productIdParamSchema } from "./wishlist.validation.js";
import { listMyWishlist, addToWishlist, removeFromWishlist } from "./wishlist.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", listMyWishlist);
router.post("/:productId", validate(productIdParamSchema), addToWishlist);
router.delete("/:productId", validate(productIdParamSchema), removeFromWishlist);

export default router;
