import Groq from "groq-sdk";
import { AI_CONFIG } from "../../../config/ai.config.js";

if (!AI_CONFIG.groq.apiKey) {
  throw new Error("Missing GROQ_API_KEY");
}

const groq = new Groq({
  apiKey: AI_CONFIG.groq.apiKey,
});

const groqProvider = {
  name: "groq",

  async generate({ message, model }) {
    try {
      const completion =
        await groq.chat.completions.create({
          model:
            model || AI_CONFIG.groq.model,

          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        });

      return {
        provider: "groq",
        model:
          model || AI_CONFIG.groq.model,
        content:
          completion.choices[0].message.content,
      };
    } catch (error) {
      throw new Error(
        "Groq provider failed: " +
          error.message
      );
    }
  },
};

export default groqProvider;