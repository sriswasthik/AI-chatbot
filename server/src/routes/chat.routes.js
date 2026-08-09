import express from "express";

import {
  sendMessage,
} from "../controllers/chat.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  sendMessage
);

export default router;