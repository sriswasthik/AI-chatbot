import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import { asyncHandler } from "../utils/asyncHandler.js";

/*
|--------------------------------------------------------------------------
| Ownership
|--------------------------------------------------------------------------
|
| Every lookup is scoped by req.user, so another user's conversation is
| indistinguishable from one that does not exist. A malformed id is a 400
| rather than a CastError bubbling up as a 500.
*/

async function findOwnedConversation(req) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error(
      "Invalid conversation id."
    );

    error.statusCode = 400;

    throw error;
  }

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!conversation) {
    const error = new Error(
      "Conversation not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return conversation;
}

/*
|--------------------------------------------------------------------------
| Legacy message backfill
|--------------------------------------------------------------------------
|
| Messages used to be embedded in the conversation document. Conversations
| created before that change are migrated the first time they are opened,
| so existing chat history survives the schema move without a manual
| migration step. Reads use lean() because the `messages` array is no
| longer part of the schema and would otherwise be stripped on hydration.
*/

async function backfillLegacyMessages(conversationId) {
  const raw = await Conversation.collection.findOne(
    { _id: new mongoose.Types.ObjectId(conversationId) },
    { projection: { messages: 1 } }
  );

  const legacy = raw?.messages;

  if (!Array.isArray(legacy) || legacy.length === 0) {
    return;
  }

  const existing = await Message.countDocuments({
    conversation: conversationId,
  });

  if (existing > 0) {
    /*
    | Already migrated (or written to since). Drop the stale array and
    | leave the Message collection alone.
    */

    await Conversation.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(conversationId) },
      { $unset: { messages: "" } }
    );

    return;
  }

  await Message.insertMany(
    legacy.map((message) => ({
      conversation: conversationId,
      role: message.role,
      content: message.content,
      provider: message.provider ?? null,
      model: message.model ?? null,
      latencyMs: message.latencyMs ?? null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })),
    { ordered: true, timestamps: false }
  );

  await Conversation.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(conversationId) },
    { $unset: { messages: "" } }
  );

  console.log(
    `Migrated ${legacy.length} embedded messages for conversation ${conversationId}`
  );
}

/*
|--------------------------------------------------------------------------
| Create Conversation
|--------------------------------------------------------------------------
| POST /api/conversations
|
| Not used by the chat flow -- POST /api/chat is the only path that creates
| a conversation during a normal send. This exists for clients that want an
| empty conversation up front.
*/

export const createConversation = asyncHandler(
  async (req, res) => {
    const conversation = await Conversation.create({
      user: req.user.id,
      title: req.body.title,
      provider: req.body.provider,
    });

    return res.status(201).json({
      success: true,
      data: conversation,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Get All Conversations
|--------------------------------------------------------------------------
| GET /api/conversations
*/

export const getConversations = asyncHandler(
  async (req, res) => {
    const { limit, before } = req.validatedQuery;

    /*
    | Keyset pagination on updatedAt, which is what the list is sorted by.
    | An offset would skip or repeat rows as conversations reorder between
    | requests. One extra row is fetched to detect whether more remain.
    */

    const filter = { user: req.user.id };

    if (before) {
      filter.updatedAt = { $lt: before };
    }

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = conversations.length > limit;

    const page = hasMore
      ? conversations.slice(0, limit)
      : conversations;

    return res.status(200).json({
      success: true,
      data: page,
      pagination: {
        hasMore,
        nextCursor: hasMore
          ? page[page.length - 1].updatedAt
          : null,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Get Single Conversation
|--------------------------------------------------------------------------
| GET /api/conversations/:id
|
| Returns the conversation with its messages in chronological order.
*/

export const getConversation = asyncHandler(
  async (req, res) => {
    const conversation = await findOwnedConversation(req);

    await backfillLegacyMessages(conversation._id);

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    return res.status(200).json({
      success: true,

      data: {
        ...conversation.toObject(),
        messages,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Update Conversation
|--------------------------------------------------------------------------
| PATCH /api/conversations/:id
*/

export const updateConversation = asyncHandler(
  async (req, res) => {
    const conversation = await findOwnedConversation(req);

    /*
    | The body is already validated and trimmed, and only declared fields
    | survive the schema, so it can be applied directly.
    */

    Object.assign(conversation, req.body);

    await conversation.save();

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Delete Conversation
|--------------------------------------------------------------------------
| DELETE /api/conversations/:id
|
| Messages are a separate collection now, so they have to be removed
| explicitly or they would be orphaned.
*/

export const deleteConversation = asyncHandler(
  async (req, res) => {
    const conversation = await findOwnedConversation(req);

    await Message.deleteMany({
      conversation: conversation._id,
    });

    await conversation.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully.",
    });
  }
);
