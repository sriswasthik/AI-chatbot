import {
  getProvider,
  getConfiguredProviders,
} from "./provider.registry.js";

import {
  AI_AUTO_PROVIDER_CHAIN,
  AI_REQUEST_TIMEOUT_MS,
} from "../../config/ai.config.js";

/*
|--------------------------------------------------------------------------
| Timeout
|--------------------------------------------------------------------------
|
| Neither SDK exposes a reliable request timeout, so the call is raced
| against a timer. The underlying request is not cancelled, but the
| handler stops waiting on it.
*/

function withTimeout(promise, timeoutMs, providerName) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(
        `${providerName} timed out after ${timeoutMs}ms.`
      );

      error.statusCode = 504;

      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(
    () => clearTimeout(timer)
  );
}

/*
|--------------------------------------------------------------------------
| Provider resolution
|--------------------------------------------------------------------------
|
| "auto" expands to the configured fallback chain. An explicit provider is
| tried on its own -- an explicit choice is never silently overridden.
*/

function resolveProviderChain(requested) {
  if (requested !== "auto") {
    return [requested];
  }

  const configured = getConfiguredProviders();

  const chain = AI_AUTO_PROVIDER_CHAIN.filter(
    (name) => configured.includes(name)
  );

  return chain.length > 0
    ? chain
    : AI_AUTO_PROVIDER_CHAIN;
}

/*
|--------------------------------------------------------------------------
| Generate
|--------------------------------------------------------------------------
|
| `messages` is the conversation so far in [{ role, content }] form,
| ending with the user turn that needs an answer. Passing the full window
| is what gives the assistant memory across turns.
*/

export async function generateAIResponse({
  messages,
  provider = "auto",
  model = null,
}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error(
      "generateAIResponse requires a non-empty messages array."
    );
  }

  const chain = resolveProviderChain(provider);

  let lastError = null;

  for (const providerName of chain) {
    const adapter = getProvider(providerName);

    const startTime = Date.now();

    try {
      const result = await withTimeout(
        adapter.generate({ messages, model }),
        AI_REQUEST_TIMEOUT_MS,
        providerName
      );

      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      console.error(
        `AI provider "${providerName}" failed: ${error.message}`
      );

      /*
      | A model name only makes sense for the provider it was chosen
      | for, so it must not be carried into a fallback attempt.
      */

      model = null;
    }
  }

  const error = new Error(
    `AI request failed: ${
      lastError?.message || "no provider available"
    }`
  );

  error.statusCode = lastError?.statusCode || 502;

  throw error;
}
