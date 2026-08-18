/*
|--------------------------------------------------------------------------
| Test harness
|--------------------------------------------------------------------------
|
| Boots an in-memory MongoDB and stubs the AI providers so the suite runs
| offline, with no API keys and no provider spend.
|
| Env vars are set before app.js is imported, because ai.config.js and the
| CORS setup read process.env at module evaluation time.
*/

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

/*
| Resolves a MongoDB to test against:
|
|   1. MONGODB_TEST_URI, if you already have one running.
|   2. An ephemeral in-memory server (downloads mongod on first run).
|
| Returns null when neither is available -- for example in a sandbox with
| no outbound access to fastdl.mongodb.org -- so the suite can skip with a
| clear message instead of reporting dozens of misleading failures.
*/

export async function resolveTestUri() {
  if (process.env.MONGODB_TEST_URI) {
    return process.env.MONGODB_TEST_URI;
  }

  try {
    mongoServer = await MongoMemoryServer.create();

    return mongoServer.getUri();
  } catch (error) {
    console.error(
      `\nCould not start an in-memory MongoDB: ${error.message}\n` +
        "Set MONGODB_TEST_URI to point the suite at a running MongoDB instead.\n"
    );

    return null;
  }
}

export async function startTestEnvironment(uri) {
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test-secret-for-suite-only";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.GROQ_API_KEY = "test-groq-key";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.CLIENT_URL = "http://localhost:5173";

  /*
  | The suite registers a fresh user per test from a single address, which
  | legitimately trips the production auth limit. Raised rather than
  | disabled, so the limiters stay mounted and their behaviour is still
  | exercised (see the rate-limit tests).
  */

  process.env.AUTH_RATE_LIMIT_MAX = "10000";
  process.env.API_RATE_LIMIT_MAX = "10000";
  process.env.CHAT_RATE_LIMIT_MAX = "10000";

  await mongoose.connect(process.env.MONGODB_URI);

  const { default: app } = await import(
    "../src/app.js"
  );

  return app;
}

export async function stopTestEnvironment() {
  await mongoose.disconnect();

  await mongoServer?.stop();
}

export async function resetDatabase() {
  const collections =
    await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

/*
|--------------------------------------------------------------------------
| Provider stubbing
|--------------------------------------------------------------------------
|
| The registry hands out singleton adapter objects, so replacing `generate`
| on the returned object swaps provider behaviour for the whole app without
| a module loader hook.
*/

export async function stubProvider(
  name,
  implementation
) {
  const { getProvider } = await import(
    "../src/services/ai/provider.registry.js"
  );

  const provider = getProvider(name);

  const original = provider.generate;

  provider.generate = implementation;

  return () => {
    provider.generate = original;
  };
}

export function echoProvider(name) {
  return async ({ messages, model }) => ({
    provider: name,
    model: model || `${name}-test-model`,

    /*
    | Echoing the history length lets tests assert that prior turns are
    | actually reaching the provider.
    */
    content: `[${name}] turns=${messages.length} last=${
      messages[messages.length - 1].content
    }`,
  });
}

export function failingProvider(message) {
  return async () => {
    throw new Error(message);
  };
}

/*
| Registers a user and returns { token, user }.
*/

export async function createUserAndLogin(
  request,
  app,
  overrides = {}
) {
  const credentials = {
    name: "Test User",
    email: `user-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}@example.com`,
    password: "password123",
    ...overrides,
  };

  await request(app)
    .post("/api/auth/register")
    .send(credentials)
    .expect(201);

  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: credentials.email,
      password: credentials.password,
    })
    .expect(200);

  return {
    token: response.body.token,
    user: response.body.user,
    credentials,
  };
}
