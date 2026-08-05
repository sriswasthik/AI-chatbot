import { z } from "zod";

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
    .enum([
      "auto",
      "openai",
      "gemini",
      "groq",
      "openrouter",
    ])
    .default("auto"),

  model: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),
});