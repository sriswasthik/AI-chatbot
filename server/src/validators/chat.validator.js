import { z } from "zod";

/*
| Note: `validate` replaces req.body with the parsed result, and zod strips
| unknown keys. Any field the controller reads MUST be declared here --
| omitting conversationId is what silently dropped it from the request and
| caused every message to start a new conversation.
*/

const objectId = z
  .string()
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid conversation id."
  );

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(
      4000,
      "Message cannot exceed 4000 characters."
    ),

  provider: z
    .enum(["auto", "gemini", "groq"])
    .default("auto"),

  model: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  /*
  | null for the first message in a new chat, an id for every message
  | after that. Absent, null and "" all normalise to null.
  */

  conversationId: objectId
    .nullish()
    .or(z.literal(""))
    .transform((value) => value || null)
    .default(null),

  /*
  | Retry regenerates a reply for the user message already stored at the
  | end of the conversation. The user turn is not written again, so a
  | failed send that is retried does not duplicate what the user typed.
  */

  retry: z.boolean().default(false),
})
  .refine(
    (data) => !data.retry || data.conversationId !== null,
    {
      message:
        "A retry requires the conversation it belongs to.",
      path: ["conversationId"],
    }
  );
