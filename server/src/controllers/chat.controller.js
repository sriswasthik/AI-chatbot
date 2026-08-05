import {
  generateAIResponse,
} from "../services/ai/ai.gateway.js";

import {
  asyncHandler,
} from "../utils/asyncHandler.js";

export const sendMessage = asyncHandler(
  async (req, res) => {
    const {
      message,
      provider,
      model,
    } = req.body;

    const result = await generateAIResponse({
      message,
      provider,
      model,
    });

    return res.status(200).json({
      success: true,
      data: {
        content: result.content,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });
  }
);