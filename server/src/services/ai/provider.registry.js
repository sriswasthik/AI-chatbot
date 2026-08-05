import openaiProvider from "./providers/openai.provider.js";
import geminiProvider from "./providers/gemini.provider.js";
import groqProvider from "./providers/groq.provider.js";
import openrouterProvider from "./providers/openrouter.provider.js";

const providers = {
  openai: openaiProvider,
  gemini: geminiProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
};

export function getProvider(name) {
  const provider = providers[name];

  if (!provider) {
    const error = new Error(
      `Unsupported AI provider: ${name}`
    );

    error.statusCode = 400;

    throw error;
  }

  return provider;
}

export function getAvailableProviders() {
  return Object.keys(providers);
}