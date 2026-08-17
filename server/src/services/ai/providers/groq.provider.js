import Groq from "groq-sdk";

import { AI_CONFIG } from "../../../config/ai.config.js";

/*
| The SDK client is created on first use rather than at import time, so a
| missing GROQ_API_KEY degrades to a clean per-request error instead of
| crashing the whole server at boot.
*/

let client = null;

function getClient() {
  if (!AI_CONFIG.groq.apiKey) {
    const error = new Error(
      "Groq is not configured. Set GROQ_API_KEY."
    );

    error.statusCode = 503;

    throw error;
  }

  if (!client) {
    client = new Groq({
      apiKey: AI_CONFIG.groq.apiKey,
    });
  }

  return client;
}

const groqProvider = {
  name: "groq",

  isConfigured() {
    return Boolean(AI_CONFIG.groq.apiKey);
  },

  /*
  | `messages` is the full conversation so far, already trimmed to the
  | configured history window, in [{ role, content }] form.
  */

  async generate({ messages, model }) {
    const selectedModel =
      model || AI_CONFIG.groq.model;

    const completion =
      await getClient().chat.completions.create({
        model: selectedModel,
        messages,
      });

    const content =
      completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(
        "Groq returned an empty response."
      );
    }

    return {
      provider: "groq",
      model: selectedModel,
      content,
    };
  },
};

export default groqProvider;
