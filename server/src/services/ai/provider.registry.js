import geminiProvider from "./providers/gemini.provider.js";
import groqProvider from "./providers/groq.provider.js";

/*
| Only providers with a real implementation are registered. The previous
| OpenAI and OpenRouter adapters returned hardcoded mock strings and have
| been removed rather than shipped in a production path.
*/

const providers = {
  gemini: geminiProvider,
  groq: groqProvider,
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

export function getConfiguredProviders() {
  return Object.keys(providers).filter((name) =>
    providers[name].isConfigured()
  );
}
