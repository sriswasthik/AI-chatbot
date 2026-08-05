import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "../../../config/ai.config.js";

const ai = new GoogleGenAI({
  apiKey: AI_CONFIG.gemini.apiKey,
});

const geminiProvider = {
  name: "gemini",

  async generate({ message, model }) {
    const response = await ai.models.generateContent({
      model: model || AI_CONFIG.gemini.model,
      contents: message,
    });

    return {
      provider: "gemini",
      model: model || AI_CONFIG.gemini.model,
      content: response.text,
    };
  },
};
try {
  // generateContent(...)
} catch (error) {
  throw new Error(
    "Gemini provider failed: " + error.message
  );
}

export default geminiProvider;