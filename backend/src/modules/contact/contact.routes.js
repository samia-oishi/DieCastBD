import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { contactSchema } from "./contact.validation.js";
import { submitContactMessage } from "./contact.controller.js";

const router = Router();
router.post("/", validate(contactSchema), submitContactMessage);

export default router;
