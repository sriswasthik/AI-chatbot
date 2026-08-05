export const AI_CONFIG = {
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-3.6-flash",
    },

    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.3-70b-versatile",
    },

    openai: {
        apiKey: process.env.OPENAI_API_KEY,
    },

    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
    },
};