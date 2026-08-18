/*
|--------------------------------------------------------------------------
| Unit tests
|--------------------------------------------------------------------------
|
| Everything here runs without a database, so it executes anywhere.
| The database-backed lifecycle tests live in chat.test.js.
*/

import test, { before } from "node:test";
import assert from "node:assert/strict";

import express from "express";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.GROQ_API_KEY = "test-groq-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.AI_REQUEST_TIMEOUT_MS = "300";

let chatSchema;
let generateAIResponse;
let getProvider;
let getConfiguredProviders;
let errorHandler;
let notFound;
let validate;

before(async () => {
  ({ chatSchema } = await import(
    "../src/validators/chat.validator.js"
  ));

  ({ generateAIResponse } = await import(
    "../src/services/ai/ai.gateway.js"
  ));

  ({ getProvider, getConfiguredProviders } =
    await import(
      "../src/services/ai/provider.registry.js"
    ));

  ({ errorHandler, notFound } = await import(
    "../src/middleware/error.middleware.js"
  ));

  ({ validate } = await import(
    "../src/middleware/validate.middleware.js"
  ));
});

/*
|--------------------------------------------------------------------------
| chatSchema
|--------------------------------------------------------------------------
|
| The validator replaces req.body with its output and zod strips unknown
| keys, so an undeclared conversationId would be silently deleted. These
| tests lock that down.
*/

test("chatSchema preserves a valid conversationId", () => {
  const parsed = chatSchema.parse({
    message: "hello",
    provider: "groq",
    conversationId: "0123456789abcdef01234567",
  });

  assert.equal(
    parsed.conversationId,
    "0123456789abcdef01234567"
  );
});

test("chatSchema normalises absent, null and empty conversationId to null", () => {
  assert.equal(
    chatSchema.parse({ message: "hi" })
      .conversationId,
    null
  );

  assert.equal(
    chatSchema.parse({
      message: "hi",
      conversationId: null,
    }).conversationId,
    null
  );

  assert.equal(
    chatSchema.parse({
      message: "hi",
      conversationId: "",
    }).conversationId,
    null
  );
});

test("chatSchema rejects a malformed conversationId", () => {
  assert.throws(() =>
    chatSchema.parse({
      message: "hi",
      conversationId: "not-an-id",
    })
  );
});

test("chatSchema defaults provider to auto and rejects removed providers", () => {
  assert.equal(
    chatSchema.parse({ message: "hi" }).provider,
    "auto"
  );

  assert.throws(() =>
    chatSchema.parse({
      message: "hi",
      provider: "openai",
    })
  );
});

test("chatSchema rejects blank and oversized messages", () => {
  assert.throws(() =>
    chatSchema.parse({ message: "   " })
  );

  assert.throws(() =>
    chatSchema.parse({
      message: "x".repeat(4001),
    })
  );
});

/*
|--------------------------------------------------------------------------
| validate middleware
|--------------------------------------------------------------------------
*/

test("validate passes the parsed body through to the handler", async () => {
  const app = express();

  app.use(express.json());

  app.post(
    "/t",
    validate(chatSchema),
    (req, res) => res.json(req.body)
  );

  const response = await request(app)
    .post("/t")
    .send({
      message: "  hello  ",
      conversationId: "0123456789abcdef01234567",
      somethingUnknown: "dropped",
    })
    .expect(200);

  assert.equal(response.body.message, "hello");

  assert.equal(
    response.body.conversationId,
    "0123456789abcdef01234567"
  );

  assert.equal(
    response.body.somethingUnknown,
    undefined
  );
});

/*
|--------------------------------------------------------------------------
| Provider registry
|--------------------------------------------------------------------------
*/

test("only real providers are registered", () => {
  assert.deepEqual(
    getConfiguredProviders().sort(),
    ["gemini", "groq"]
  );

  assert.throws(() => getProvider("openai"));

  assert.throws(() => getProvider("openrouter"));
});

/*
|--------------------------------------------------------------------------
| AI gateway
|--------------------------------------------------------------------------
*/

function stub(name, implementation) {
  const provider = getProvider(name);

  const original = provider.generate;

  provider.generate = implementation;

  return () => {
    provider.generate = original;
  };
}

test("the gateway forwards the full message history to the provider", async () => {
  let received;

  const restore = stub("groq", async ({ messages }) => {
    received = messages;

    return {
      provider: "groq",
      model: "m",
      content: "ok",
    };
  });

  try {
    const history = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
      { role: "user", content: "explain Java" },
    ];

    const result = await generateAIResponse({
      messages: history,
      provider: "groq",
    });

    assert.deepEqual(received, history);

    assert.equal(typeof result.latencyMs, "number");
  } finally {
    restore();
  }
});

test("auto falls through to the next provider on failure", async () => {
  const restoreGroq = stub("groq", async () => {
    throw new Error("groq down");
  });

  const restoreGemini = stub(
    "gemini",
    async () => ({
      provider: "gemini",
      model: "g",
      content: "from gemini",
    })
  );

  try {
    const result = await generateAIResponse({
      messages: [
        { role: "user", content: "hello" },
      ],
      provider: "auto",
    });

    assert.equal(result.provider, "gemini");
  } finally {
    restoreGroq();
    restoreGemini();
  }
});

test("an explicit provider is never silently swapped for another", async () => {
  const restore = stub("gemini", async () => {
    throw new Error("gemini down");
  });

  try {
    await assert.rejects(
      generateAIResponse({
        messages: [
          { role: "user", content: "hello" },
        ],
        provider: "gemini",
      }),
      /gemini down/
    );
  } finally {
    restore();
  }
});

test("a model name is not carried into the fallback provider", async () => {
  let geminiModel = "unset";

  const restoreGroq = stub("groq", async () => {
    throw new Error("groq down");
  });

  const restoreGemini = stub(
    "gemini",
    async ({ model }) => {
      geminiModel = model;

      return {
        provider: "gemini",
        model: "default",
        content: "ok",
      };
    }
  );

  try {
    await generateAIResponse({
      messages: [
        { role: "user", content: "hello" },
      ],
      provider: "auto",
      model: "a-groq-only-model",
    });

    assert.equal(geminiModel, null);
  } finally {
    restoreGroq();
    restoreGemini();
  }
});

test("a hanging provider is abandoned at the timeout", async () => {
  const restoreGroq = stub(
    "groq",
    () => new Promise(() => {})
  );

  const restoreGemini = stub(
    "gemini",
    () => new Promise(() => {})
  );

  try {
    await assert.rejects(
      generateAIResponse({
        messages: [
          { role: "user", content: "hello" },
        ],
        provider: "auto",
      }),
      /timed out/
    );
  } finally {
    restoreGroq();
    restoreGemini();
  }
});

test("the gateway refuses an empty history", async () => {
  await assert.rejects(
    generateAIResponse({
      messages: [],
      provider: "groq",
    }),
    /non-empty messages array/
  );
});

/*
|--------------------------------------------------------------------------
| Error handling
|--------------------------------------------------------------------------
*/

function errorApp(handler) {
  const app = express();

  app.get("/boom", handler);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

test("a deliberate statusCode is honoured and its message surfaced", async () => {
  const app = errorApp((req, res, next) => {
    const error = new Error(
      "Conversation not found."
    );

    error.statusCode = 404;

    next(error);
  });

  const response = await request(app)
    .get("/boom")
    .expect(404);

  assert.equal(response.body.success, false);

  assert.equal(
    response.body.message,
    "Conversation not found."
  );
});

test("unknown routes return a 404 envelope", async () => {
  const response = await request(
    errorApp((req, res) => res.json({}))
  )
    .get("/nope")
    .expect(404);

  assert.equal(response.body.success, false);
});

test("unexpected internals are hidden in production but not in development", async () => {
  const app = errorApp((req, res, next) => {
    next(
      new Error(
        "connection <monitor> to 10.0.0.1:27017 closed"
      )
    );
  });

  const original = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = "production";

    const prod = await request(app)
      .get("/boom")
      .expect(500);

    assert.equal(
      prod.body.message,
      "Internal Server Error"
    );

    assert.equal(prod.body.stack, undefined);

    process.env.NODE_ENV = "development";

    const dev = await request(app)
      .get("/boom")
      .expect(500);

    assert.match(dev.body.message, /27017/);
  } finally {
    process.env.NODE_ENV = original;
  }
});
