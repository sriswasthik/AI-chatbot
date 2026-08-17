import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { getConfiguredProviders } from "./services/ai/provider.registry.js";

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Environment preflight
|--------------------------------------------------------------------------
|
| Fail loudly at boot instead of producing confusing per-request errors
| later (an undefined JWT_SECRET, for example, fails every token check
| with no obvious cause).
*/

function verifyEnvironment() {
  const required = ["MONGODB_URI", "JWT_SECRET"];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", "
      )}`
    );
  }

  const providers = getConfiguredProviders();

  if (providers.length === 0) {
    throw new Error(
      "No AI provider is configured. Set GEMINI_API_KEY and/or GROQ_API_KEY."
    );
  }

  console.log(
    `AI providers configured: ${providers.join(", ")}`
  );
}

async function startServer() {
  try {
    verifyEnvironment();

    await connectDatabase();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(
        `${signal} received, shutting down.`
      );

      server.close(() => process.exit(0));
    };

    process.on("SIGTERM", () =>
      shutdown("SIGTERM")
    );

    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
