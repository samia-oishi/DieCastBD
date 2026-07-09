import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { createAddressSchema, updateAddressSchema, idParamSchema } from "./address.validation.js";
import { listMyAddresses, createAddress, updateAddress, deleteAddress } from "./address.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", listMyAddresses);
router.post("/", validate(createAddressSchema), createAddress);
router.patch("/:id", validate(updateAddressSchema), updateAddress);
router.delete("/:id", validate(idParamSchema), deleteAddress);

export default router;
