import { GoogleGenAI } from "@google/genai";

import { AI_CONFIG } from "../../../config/ai.config.js";

/*
| Created on first use for the same reason as the Groq client: a missing
| key must not take the server down at import time.
*/

let client = null;

function getClient() {
  if (!AI_CONFIG.gemini.apiKey) {
    const error = new Error(
      "Gemini is not configured. Set GEMINI_API_KEY."
    );

    error.statusCode = 503;

    throw error;
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: AI_CONFIG.gemini.apiKey,
    });
  }

  return client;
}

/*
| Gemini uses `model`/`user` rather than `assistant`/`user`, and carries
| the running history in `contents`.
*/

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role:
      message.role === "assistant"
        ? "model"
        : "user",

    parts: [{ text: message.content }],
  }));
}

const geminiProvider = {
  name: "gemini",

  isConfigured() {
    return Boolean(AI_CONFIG.gemini.apiKey);
  },

  async generate({ messages, model }) {
    const selectedModel =
      model || AI_CONFIG.gemini.model;

    const response =
      await getClient().models.generateContent({
        model: selectedModel,
        contents: toGeminiContents(messages),
      });

    const content = response.text;

    if (!content) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    return {
      provider: "gemini",
      model: selectedModel,
      content,
    };
  },
};

export default geminiProvider;
