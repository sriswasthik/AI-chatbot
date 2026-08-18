import { z } from "zod";

/*
| Conversation routes previously accepted arbitrary bodies. Mongoose casting
| caught most of it, but a non-string title reached the controller and query
| operators could be smuggled through fields that are interpolated rather
| than cast. These schemas close that off, and `validate` replaces req.body
| with the parsed result so controllers only ever see declared fields.
*/

const title = z
  .string()
  .trim()
  .min(1, "Conversation title cannot be empty.")
  .max(100, "Conversation title cannot exceed 100 characters.");

const provider = z.enum(["auto", "gemini", "groq"]);

export const createConversationSchema = z.object({
  title: title.default("New Chat"),
  provider: provider.default("auto"),
});

/*
| PATCH is partial, but an empty body is a client mistake rather than a
| no-op update, so it is rejected.
*/

export const updateConversationSchema = z
  .object({
    title: title.optional(),
    provider: provider.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.provider !== undefined,
    { message: "Nothing to update." }
  );

/*
| Sidebar pagination. Parsed from the query string, so values arrive as
| strings and are coerced.
*/

export const listConversationsSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),

  before: z.coerce.date().optional(),
});
