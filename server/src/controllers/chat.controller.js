import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import { generateAIResponse } from "../services/ai/ai.gateway.js";
import { getConfiguredProviders } from "../services/ai/provider.registry.js";
import { AI_HISTORY_LIMIT } from "../config/ai.config.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/*
|--------------------------------------------------------------------------
| Title
|--------------------------------------------------------------------------
|
| The first user message names the conversation. `title` is capped at 100
| in the schema; 60 keeps the sidebar readable.
*/

function buildTitle(message) {
  const title = message.trim().slice(0, 60);

  return title.length < message.trim().length
    ? `${title}...`
    : title;
}

/*
|--------------------------------------------------------------------------
| Conversation resolution
|--------------------------------------------------------------------------
|
| Two rules, both load-bearing for the duplicate-conversation bug:
|
|   1. A conversationId that is present but unusable is an error. It is
|      never downgraded into "create a new conversation", because that is
|      exactly how one chat silently becomes several.
|
|   2. Ownership always comes from req.user. The lookup is scoped by user,
|      so another user's id is indistinguishable from a missing one and
|      returns 404 without confirming the conversation exists.
*/

async function resolveConversation({
  conversationId,
  userId,
  message,
  provider,
}) {
  if (!conversationId) {
    const conversation = await Conversation.create({
      user: userId,
      title: buildTitle(message),
      provider,
    });

    return { conversation, created: true };
  }

  if (!mongoose.isValidObjectId(conversationId)) {
    const error = new Error(
      "Invalid conversation id."
    );

    error.statusCode = 400;

    throw error;
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    user: userId,
  });

  if (!conversation) {
    const error = new Error(
      "Conversation not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return { conversation, created: false };
}

/*
|--------------------------------------------------------------------------
| History
|--------------------------------------------------------------------------
|
| The most recent turns, oldest first, in the shape the providers expect.
| Fetching newest-first and reversing keeps the limit on the right end of
| the conversation.
*/

async function loadHistory(conversationId) {
  const messages = await Message.find({
    conversation: conversationId,
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(AI_HISTORY_LIMIT)
    .select("role content")
    .lean();

  return messages.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

/*
|--------------------------------------------------------------------------
| Send Message
|--------------------------------------------------------------------------
| POST /api/chat
|
| Request body (validated by chatSchema):
|   { message, provider?, model?, conversationId? }
|
| Response:
|   { success, data: { conversationId, content, provider, model, latencyMs } }
|
| On AI failure the response still carries conversationId so the client can
| keep the user on the same conversation instead of starting a new one with
| the next message.
*/

export const sendMessage = asyncHandler(
  async (req, res) => {
    const {
      message,
      provider = "auto",
      model,
      conversationId = null,
      retry = false,
    } = req.body;

    const userId = req.user.id;

    const { conversation, created } =
      await resolveConversation({
        conversationId,
        userId,
        message,
        provider,
      });

    /*
    | Resolved once and reused everywhere below, so the id returned to the
    | client is always the id the messages were written against.
    */

    const activeConversationId =
      conversation._id.toString();

    /*
    | Persist the user turn before calling the provider so a provider
    | failure never loses what the user typed.
    |
    | A retry skips this: the user message is already stored from the
    | attempt that failed, and writing it again would duplicate the turn.
    */

    if (retry) {
      const lastMessage = await Message.findOne({
        conversation: activeConversationId,
      })
        .sort({ createdAt: -1, _id: -1 })
        .select("role")
        .lean();

      if (lastMessage?.role !== "user") {
        const error = new Error(
          "There is no message to retry."
        );

        error.statusCode = 409;

        throw error;
      }
    } else {
      await Message.create({
        conversation: activeConversationId,
        role: "user",
        content: message.trim(),
      });
    }

    let result;

    try {
      const history = await loadHistory(
        activeConversationId
      );

      result = await generateAIResponse({
        messages: history,
        provider,
        model,
      });
    } catch (error) {
      /*
      | Bump the conversation so the half-finished chat still sorts into
      | the sidebar, then hand the id back with the error.
      */

      conversation.updatedAt = new Date();

      await conversation.save();

      return res
        .status(error.statusCode || 502)
        .json({
          success: false,

          message: error.message,

          data: {
            conversationId: activeConversationId,
          },
        });
    }

    await Message.create({
      conversation: activeConversationId,
      role: "assistant",
      content: result.content,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    });

    /*
    | Record which provider actually answered (relevant when "auto" fell
    | through to the second choice) and refresh updatedAt for sidebar
    | ordering. Messages live in their own collection, so this write stays
    | small no matter how long the conversation gets.
    */

    conversation.provider =
      result.provider || provider;

    conversation.updatedAt = new Date();

    await conversation.save();

    if (created) {
      console.log(
        `Created conversation ${activeConversationId} for user ${userId}`
      );
    }

    return res.status(200).json({
      success: true,

      data: {
        conversationId: activeConversationId,
        content: result.content,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| List Providers
|--------------------------------------------------------------------------
| GET /api/chat/providers
|
| Lets the client offer only providers that actually have a key configured,
| instead of hardcoding a list and failing at send time.
*/

export const getProviders = asyncHandler(
  async (req, res) => {
    return res.status(200).json({
      success: true,

      data: {
        providers: getConfiguredProviders(),
        default: "auto",
      },
    });
  }
);
