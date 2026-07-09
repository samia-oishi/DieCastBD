import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { addItemSchema, updateItemSchema, productIdParamSchema, mergeCartSchema } from "./cart.validation.js";
import { getMyCart, addItem, updateItem, removeItem, mergeCart } from "./cart.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", getMyCart);
router.post("/items", validate(addItemSchema), addItem);
router.patch("/items/:productId", validate(updateItemSchema), updateItem);
router.delete("/items/:productId", validate(productIdParamSchema), removeItem);
router.post("/merge", validate(mergeCartSchema), mergeCart);

export default router;
