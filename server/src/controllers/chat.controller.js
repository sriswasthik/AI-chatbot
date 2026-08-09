import Conversation from "../models/Conversation.js";

import {
  generateAIResponse,
} from "../services/ai/ai.gateway.js";

import {
  asyncHandler,
} from "../utils/asyncHandler.js";

export const sendMessage = asyncHandler(
  async (req, res) => {
    const {
      message,
      provider = "auto",
      model,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Conversation ID
    |--------------------------------------------------------------------------
    |
    | Accept it from BOTH:
    |
    | req.body.conversationId
    |
    | AND
    |
    | req.query.conversationId
    |
    */

    const conversationId =
      req.body?.conversationId ||
      req.query?.conversationId ||
      null;

    console.log(
      "========================================"
    );

    console.log(
      "CHAT REQUEST"
    );

    console.log(
      "User:",
      req.user?.id
    );

    console.log(
      "Message:",
      message
    );

    console.log(
      "Body conversationId:",
      req.body?.conversationId
    );

    console.log(
      "Query conversationId:",
      req.query?.conversationId
    );

    console.log(
      "FINAL conversationId:",
      conversationId
    );

    console.log(
      "========================================"
    );

    /*
    |--------------------------------------------------------------------------
    | Validate message
    |--------------------------------------------------------------------------
    */

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find existing conversation
    |--------------------------------------------------------------------------
    */

    let conversation;

    if (conversationId) {
      console.log(
        "LOOKING FOR EXISTING CONVERSATION:",
        conversationId
      );

      conversation =
        await Conversation.findOne({
          _id: conversationId,
          user: req.user.id,
        });

      if (!conversation) {
        console.log(
          "CONVERSATION NOT FOUND:",
          conversationId
        );

        return res.status(404).json({
          success: false,
          message:
            "Conversation not found.",
        });
      }

      console.log(
        "EXISTING CONVERSATION FOUND:",
        conversation._id.toString()
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create new conversation
    |--------------------------------------------------------------------------
    */

    else {
      console.log(
        "NO CONVERSATION ID."
      );

      console.log(
        "CREATING NEW CONVERSATION."
      );

      conversation =
        await Conversation.create({
          user: req.user.id,

          title:
            message.trim().slice(0, 60),

          provider,

          messages: [],
        });

      console.log(
        "NEW CONVERSATION CREATED:",
        conversation._id.toString()
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Save user message
    |--------------------------------------------------------------------------
    */

    conversation.messages.push({
      role: "user",

      content: message.trim(),
    });

    await conversation.save();

    /*
    |--------------------------------------------------------------------------
    | Generate AI response
    |--------------------------------------------------------------------------
    */

    const result =
      await generateAIResponse({
        message: message.trim(),

        provider,

        model,
      });

    /*
    |--------------------------------------------------------------------------
    | Save assistant message
    |--------------------------------------------------------------------------
    */

    conversation.messages.push({
      role: "assistant",

      content: result.content,

      provider: result.provider,

      model: result.model,

      latencyMs: result.latencyMs,
    });

    conversation.provider =
      result.provider || provider;

    await conversation.save();

    /*
    |--------------------------------------------------------------------------
    | Final ID
    |--------------------------------------------------------------------------
    */

    const finalConversationId =
      conversation._id.toString();

    console.log(
      "RETURNING CONVERSATION ID:",
      finalConversationId
    );

    return res.status(200).json({
      success: true,

      data: {
        conversationId:
          finalConversationId,

        content:
          result.content,

        provider:
          result.provider,

        model:
          result.model,

        latencyMs:
          result.latencyMs,
      },
    });
  }
);