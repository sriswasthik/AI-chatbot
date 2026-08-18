import express from "express";

import {
  sendMessage,
  getProviders,
} from "../controllers/chat.controller.js";

import { chatSchema } from "../validators/chat.validator.js";

import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { chatLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// GET /api/chat/providers
router.get("/providers", authenticate, getProviders);

// POST /api/chat
router.post(
  "/",
  authenticate,
  chatLimiter,
  validate(chatSchema),
  sendMessage
);

export default router;
