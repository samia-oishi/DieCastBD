import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { loginLimiter, refreshLimiter } from "../../middlewares/rateLimiters.js";
import { sessionSchema } from "./auth.validation.js";
import { createSession, refreshSession, logout, getMe } from "./auth.controller.js";

const router = Router();

router.post("/session", loginLimiter, validate(sessionSchema), createSession);
router.post("/refresh", refreshLimiter, refreshSession);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
