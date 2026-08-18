import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Conversation
|--------------------------------------------------------------------------
|
| A conversation is a lightweight container owned by exactly one user.
| Its messages live in the Message collection and reference this document
| via `Message.conversation`.
|
| Historical note: messages used to be embedded in this document as a
| `messages` array. Those documents are migrated lazily on first read --
| see `backfillLegacyMessages` in the conversation controller.
*/

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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
| The sidebar reads "my conversations, newest activity first".
*/

conversationSchema.index({
  user: 1,
  updatedAt: -1,
});

export default mongoose.model(
  "Conversation",
  conversationSchema
);
