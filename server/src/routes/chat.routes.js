import express from "express";

import { sendMessage } from "../controllers/chat.controller.js";

import { chatSchema } from "../validators/chat.validator.js";

import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { chatLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// POST /api/chat
router.post(
  "/",
  authenticate,
  chatLimiter,
  validate(chatSchema),
  sendMessage
);

export default router;
