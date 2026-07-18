import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { subscribeSchema, listSubscribersQuerySchema, subscriberIdParamSchema } from "./newsletter.validation.js";
import { subscribe, listSubscribersAdmin, deleteSubscriberAdmin } from "./newsletter.controller.js";

export const publicRouter = Router();
publicRouter.post("/subscribe", validate(subscribeSchema), subscribe);

export const adminRouter = Router();
adminRouter.get("/subscribers", validate(listSubscribersQuerySchema), listSubscribersAdmin);
adminRouter.delete("/subscribers/:id", validate(subscriberIdParamSchema), deleteSubscriberAdmin);
