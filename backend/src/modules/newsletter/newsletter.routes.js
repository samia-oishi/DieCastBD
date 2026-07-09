import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { subscribeSchema, listSubscribersQuerySchema } from "./newsletter.validation.js";
import { subscribe, listSubscribersAdmin } from "./newsletter.controller.js";

export const publicRouter = Router();
publicRouter.post("/subscribe", validate(subscribeSchema), subscribe);

export const adminRouter = Router();
adminRouter.get("/subscribers", validate(listSubscribersQuerySchema), listSubscribersAdmin);
