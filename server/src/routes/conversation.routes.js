import express from "express";

import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from "../controllers/conversation.controller.js";

import {
  createConversationSchema,
  updateConversationSchema,
  listConversationsSchema,
} from "../validators/conversation.validator.js";

import {
  validate,
  validateQuery,
} from "../middleware/validate.middleware.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/*
| Every conversation route requires a valid JWT. Ownership is derived from
| req.user inside the controllers, never from the request.
*/

router.use(authenticate);

// POST /api/conversations
// GET  /api/conversations
router
  .route("/")
  .post(validate(createConversationSchema), createConversation)
  .get(validateQuery(listConversationsSchema), getConversations);

// GET    /api/conversations/:id
// PATCH  /api/conversations/:id
// DELETE /api/conversations/:id
router
  .route("/:id")
  .get(getConversation)
  .patch(validate(updateConversationSchema), updateConversation)
  .delete(deleteConversation);

export default router;
