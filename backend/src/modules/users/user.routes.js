import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/auditLog.js";
import {
  updateProfileSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserAdminSchema,
  changeRoleSchema,
} from "./user.validation.js";
import {
  updateMe,
  deactivateMe,
  listUsersAdmin,
  getUserAdmin,
  updateUserAdmin,
  changeUserRole,
} from "./user.controller.js";
import { User } from "./user.model.js";

export const customerRouter = Router();
customerRouter.use(authenticate);
customerRouter.patch("/me", validate(updateProfileSchema), updateMe);
customerRouter.delete("/me", deactivateMe);

export const adminRouter = Router();
adminRouter.get("/", validate(listUsersQuerySchema), listUsersAdmin);
adminRouter.get("/:id", validate(idParamSchema), getUserAdmin);
adminRouter.patch("/:id", validate(updateUserAdminSchema), auditLog("User", User), updateUserAdmin);
// Role changes are admin-only — staff (who share requireAdmin for the rest of this
// router) cannot promote/demote anyone.
adminRouter.patch(
  "/:id/role",
  authorize("admin"),
  validate(changeRoleSchema),
  auditLog("User", User),
  changeUserRole
);
