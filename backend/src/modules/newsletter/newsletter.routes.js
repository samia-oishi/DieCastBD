import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { subscribeSchema } from "./newsletter.validation.js";
import { subscribe } from "./newsletter.controller.js";

const router = Router();
router.post("/subscribe", validate(subscribeSchema), subscribe);

export default router;
