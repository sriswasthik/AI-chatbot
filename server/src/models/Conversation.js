import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    provider: {
      type: String,
      default: null,
    },

    model: {
      type: String,
      default: null,
    },

    latencyMs: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "New Chat",
      maxlength: 100,
    },

    provider: {
      type: String,
      default: "auto",
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  user: 1,
  updatedAt: -1,
});

export default mongoose.model(
  "Conversation",
  conversationSchema
);