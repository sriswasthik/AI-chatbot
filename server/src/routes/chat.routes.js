import express from "express";

import {
  sendMessage,
} from "../controllers/chat.controller.js";

import {
  chatSchema,
} from "../validators/chat.validator.js";

import {
  validate,
} from "../middleware/validate.middleware.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(chatSchema),
  sendMessage
);

export default router;