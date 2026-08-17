/*
|--------------------------------------------------------------------------
| AI Configuration
|--------------------------------------------------------------------------
|
| Read lazily by the providers so that a missing key for one provider
| never prevents the process from booting.
*/

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : fallback;
};

export const AI_CONFIG = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model:
      process.env.GEMINI_MODEL ||
      "gemini-2.0-flash",
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model:
      process.env.GROQ_MODEL ||
      "llama-3.3-70b-versatile",
  },
};

/*
| How long a single provider call may take before it is abandoned, and
| how many prior turns are replayed to the model for context.
*/

export const AI_REQUEST_TIMEOUT_MS = toPositiveInt(
  process.env.AI_REQUEST_TIMEOUT_MS,
  30000
);

export const AI_HISTORY_LIMIT = toPositiveInt(
  process.env.AI_HISTORY_LIMIT,
  20
);

/*
| Order tried when the caller asks for provider "auto".
*/

export const AI_AUTO_PROVIDER_CHAIN = (
  process.env.AI_AUTO_PROVIDER_CHAIN ||
  "groq,gemini"
)
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);
