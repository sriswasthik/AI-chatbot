import {
  getProvider,
} from "./provider.registry.js";

export async function generateAIResponse({
  message,
  provider = "auto",
  model = null,
}) {
  let selectedProvider = provider;

  // Temporary Auto behavior.
  // Intelligent routing will replace this later.
  if (selectedProvider === "auto") {
  selectedProvider = "groq";
}

  const providerAdapter =
    getProvider(selectedProvider);

  const startTime = Date.now();

  const result = await providerAdapter.generate({
    message,
    model,
  });

  const latencyMs = Date.now() - startTime;

  return {
    ...result,
    latencyMs,
  };
}