import express from "express";

import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  register
);

// router.post(
//   "/login",
//   authLimiter,
//   validate(loginSchema),
//   login
// );

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

export default router;