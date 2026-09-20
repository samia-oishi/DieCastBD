import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import {
  subscribeSchema,
  listSubscribersQuerySchema,
  listAudienceQuerySchema,
  subscriberIdParamSchema,
} from "./newsletter.validation.js";
import {
  subscribe,
  listSubscribersAdmin,
  listAudienceAdmin,
  deleteSubscriberAdmin,
} from "./newsletter.controller.js";

export const publicRouter = Router();
publicRouter.post("/subscribe", validate(subscribeSchema), subscribe);

export const adminRouter = Router();
adminRouter.get("/subscribers", validate(listSubscribersQuerySchema), listSubscribersAdmin);
// The wider view: newsletter signups plus account holders, guest checkouts and
// restock waiters, deduplicated and each tagged with where it came from.
adminRouter.get("/audience", validate(listAudienceQuerySchema), listAudienceAdmin);
adminRouter.delete("/subscribers/:id", validate(subscriberIdParamSchema), deleteSubscriberAdmin);
