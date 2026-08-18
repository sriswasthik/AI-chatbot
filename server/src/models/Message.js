import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Message
|--------------------------------------------------------------------------
|
| Messages live in their own collection and reference their parent
| conversation. Keeping them out of the Conversation document avoids
| rewriting the whole conversation on every turn and removes the 16MB
| document ceiling on long chats.
|
| Ownership is always derived from the parent conversation, never from
| anything the client sends.
*/

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

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
    versionKey: false,
  }
);

/*
| Chronological reads scoped to one conversation are the only access
| pattern, so index exactly that.
*/

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

export default mongoose.model("Message", messageSchema);
