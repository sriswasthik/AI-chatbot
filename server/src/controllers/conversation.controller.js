import Conversation from "../models/Conversation.js";

/*
|--------------------------------------------------------------------------
| Create Conversation
|--------------------------------------------------------------------------
| POST /api/conversations
*/

export const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      user: req.user.id,
      title: req.body.title?.trim() || "New Chat",
      provider: req.body.provider || "auto",
      messages: [],
    });

    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Conversations
|--------------------------------------------------------------------------
| GET /api/conversations
*/

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      user: req.user.id,
    })
      .select("-messages")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Single Conversation
|--------------------------------------------------------------------------
| GET /api/conversations/:id
*/

export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      "Get conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Conversation
|--------------------------------------------------------------------------
| PATCH /api/conversations/:id
*/

export const updateConversation = async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.title === "string") {
      const title = req.body.title.trim();

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Conversation title cannot be empty.",
        });
      }

      updates.title = title;
    }

    if (typeof req.body.provider === "string") {
      updates.provider = req.body.provider;
    }

    const conversation =
      await Conversation.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
        },
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      "Update conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update conversation.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Conversation
|--------------------------------------------------------------------------
| DELETE /api/conversations/:id
*/

export const deleteConversation = async (req, res) => {
  try {
    const conversation =
      await Conversation.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Conversation deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete conversation.",
    });
  }
};