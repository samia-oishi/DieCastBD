import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authLimiter } from "../../middlewares/rateLimiters.js";
import { sessionSchema } from "./auth.validation.js";
import { createSession, refreshSession, logout, getMe } from "./auth.controller.js";

const router = Router();

router.post("/session", authLimiter, validate(sessionSchema), createSession);
router.post("/refresh", authLimiter, refreshSession);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
