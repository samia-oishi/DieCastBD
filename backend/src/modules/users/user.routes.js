import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { updateProfileSchema } from "./user.validation.js";
import { updateMe, deactivateMe } from "./user.controller.js";

const router = Router();

router.use(authenticate);
router.patch("/me", validate(updateProfileSchema), updateMe);
router.delete("/me", deactivateMe);

export default router;
