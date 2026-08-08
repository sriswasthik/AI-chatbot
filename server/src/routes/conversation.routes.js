import express from "express";

import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from "../controllers/conversation.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
| Every conversation route requires a valid JWT.
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Conversation Routes
|--------------------------------------------------------------------------
*/

// POST /api/conversations
// GET  /api/conversations
router
  .route("/")
  .post(createConversation)
  .get(getConversations);

// GET    /api/conversations/:id
// PATCH  /api/conversations/:id
// DELETE /api/conversations/:id
router
  .route("/:id")
  .get(getConversation)
  .patch(updateConversation)
  .delete(deleteConversation);

export default router;