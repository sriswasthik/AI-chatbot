import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import {
  resolveTestUri,
  startTestEnvironment,
  stopTestEnvironment,
  resetDatabase,
  stubProvider,
  echoProvider,
  failingProvider,
  createUserAndLogin,
} from "./helpers.js";

let app;
let restoreGroq;
let restoreGemini;

/*
| Every test in this file needs a database. If none is reachable the whole
| file is skipped with an explanation rather than failing.
*/

const uri = await resolveTestUri();

const skip = uri
  ? false
  : "no MongoDB available (set MONGODB_TEST_URI)";

before(async () => {
  if (skip) return;

  app = await startTestEnvironment(uri);

  restoreGroq = await stubProvider(
    "groq",
    echoProvider("groq")
  );

  restoreGemini = await stubProvider(
    "gemini",
    echoProvider("gemini")
  );
});

after(async () => {
  if (skip) return;

  restoreGroq?.();
  restoreGemini?.();

  await stopTestEnvironment();
});

beforeEach(async () => {
  if (skip) return;

  await resetDatabase();
});

/*
| node:test reads `skip` off the options object passed to each test.
*/

const options = { skip };

function send(token, body) {
  return request(app)
    .post("/api/chat")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

test("register then login returns a usable token", options, async () => {
  const { token, user } = await createUserAndLogin(
    request,
    app
  );

  assert.ok(token, "login must return a token");

  const me = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(me.body.user.id, user.id);
});

test("login rejects a wrong password", options, async () => {
  const { credentials } = await createUserAndLogin(
    request,
    app
  );

  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: credentials.email,
      password: "wrong-password",
    })
    .expect(401);

  assert.equal(response.body.success, false);
});

test("chat rejects an unauthenticated request", options, async () => {
  await request(app)
    .post("/api/chat")
    .send({ message: "hello" })
    .expect(401);
});

/*
|--------------------------------------------------------------------------
| PRIMARY REQUIREMENT
|--------------------------------------------------------------------------
*/

test("four messages stay in ONE conversation and produce ONE sidebar entry", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const prompts = [
    "hello",
    "explain Java",
    "give me an example",
    "explain inheritance",
  ];

  let conversationId = null;

  for (const message of prompts) {
    const response = await send(token, {
      message,
      provider: "auto",
      conversationId,
    }).expect(200);

    const returnedId =
      response.body.data.conversationId;

    assert.ok(returnedId);

    if (conversationId) {
      assert.equal(
        returnedId,
        conversationId,
        `"${message}" must reuse the existing conversation`
      );
    }

    conversationId = returnedId;
  }

  const list = await request(app)
    .get("/api/conversations")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    list.body.data.length,
    1,
    "sidebar must contain exactly one conversation"
  );

  const detail = await request(app)
    .get(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    detail.body.data.messages.length,
    8,
    "4 user + 4 assistant messages"
  );

  // Chronological order, alternating roles.
  const roles = detail.body.data.messages.map(
    (m) => m.role
  );

  assert.deepEqual(roles, [
    "user",
    "assistant",
    "user",
    "assistant",
    "user",
    "assistant",
    "user",
    "assistant",
  ]);

  assert.equal(
    detail.body.data.messages[0].content,
    "hello"
  );

  assert.equal(
    detail.body.data.messages[6].content,
    "explain inheritance"
  );

  // Every message must reference the parent conversation.
  for (const message of detail.body.data.messages) {
    assert.equal(
      message.conversation,
      conversationId
    );
  }
});

test("conversation history is forwarded to the AI provider", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const first = await send(token, {
    message: "hello",
    conversationId: null,
  }).expect(200);

  const conversationId =
    first.body.data.conversationId;

  // Turn 1: only the user's own message exists.
  assert.match(
    first.body.data.content,
    /turns=1/
  );

  const second = await send(token, {
    message: "explain Java",
    conversationId,
  }).expect(200);

  // Turn 2: user + assistant + new user message.
  assert.match(
    second.body.data.content,
    /turns=3/
  );

  assert.match(
    second.body.data.content,
    /last=explain Java/
  );
});

test("title is taken from the first message and does not change", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const first = await send(token, {
    message: "explain Java generics",
    conversationId: null,
  }).expect(200);

  const conversationId =
    first.body.data.conversationId;

  await send(token, {
    message: "something completely different",
    conversationId,
  }).expect(200);

  const list = await request(app)
    .get("/api/conversations")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(list.body.data.length, 1);

  assert.equal(
    list.body.data[0].title,
    "explain Java generics"
  );
});

/*
|--------------------------------------------------------------------------
| conversationId handling
|--------------------------------------------------------------------------
*/

test("a malformed conversationId is rejected, not silently replaced", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const response = await send(token, {
    message: "hello",
    conversationId: "not-an-object-id",
  }).expect(400);

  assert.equal(response.body.success, false);

  const list = await request(app)
    .get("/api/conversations")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    list.body.data.length,
    0,
    "a bad id must never create a conversation"
  );
});

test("a well-formed but unknown conversationId returns 404 and creates nothing", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  await send(token, {
    message: "hello",
    conversationId: "0123456789abcdef01234567",
  }).expect(404);

  const list = await request(app)
    .get("/api/conversations")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(list.body.data.length, 0);
});

test("omitting conversationId entirely is treated as a new chat", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const response = await send(token, {
    message: "hello",
  }).expect(200);

  assert.ok(response.body.data.conversationId);
});

/*
|--------------------------------------------------------------------------
| Ownership
|--------------------------------------------------------------------------
*/

test("a user cannot post into another user's conversation", options, async () => {
  const alice = await createUserAndLogin(request, app);
  const bob = await createUserAndLogin(request, app);

  const created = await send(alice.token, {
    message: "alice private message",
    conversationId: null,
  }).expect(200);

  const aliceConversationId =
    created.body.data.conversationId;

  // Bob must not be able to append to it.
  await send(bob.token, {
    message: "intrusion",
    conversationId: aliceConversationId,
  }).expect(404);

  // Nor read it.
  await request(app)
    .get(`/api/conversations/${aliceConversationId}`)
    .set("Authorization", `Bearer ${bob.token}`)
    .expect(404);

  // Nor delete it.
  await request(app)
    .delete(`/api/conversations/${aliceConversationId}`)
    .set("Authorization", `Bearer ${bob.token}`)
    .expect(404);

  // Bob's failed attempt must not have created anything for him.
  const bobList = await request(app)
    .get("/api/conversations")
    .set("Authorization", `Bearer ${bob.token}`)
    .expect(200);

  assert.equal(bobList.body.data.length, 0);

  // Alice's conversation is untouched: 1 user + 1 assistant.
  const aliceDetail = await request(app)
    .get(`/api/conversations/${aliceConversationId}`)
    .set("Authorization", `Bearer ${alice.token}`)
    .expect(200);

  assert.equal(
    aliceDetail.body.data.messages.length,
    2
  );
});

/*
|--------------------------------------------------------------------------
| Separate conversations
|--------------------------------------------------------------------------
*/

test("two conversations stay separate and messages do not mix", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const first = await send(token, {
    message: "conversation one",
    conversationId: null,
  }).expect(200);

  const firstId = first.body.data.conversationId;

  // "New Chat" is client-side: the next send simply passes null again.
  const second = await send(token, {
    message: "conversation two",
    conversationId: null,
  }).expect(200);

  const secondId = second.body.data.conversationId;

  assert.notEqual(firstId, secondId);

  await send(token, {
    message: "still conversation one",
    conversationId: firstId,
  }).expect(200);

  const list = await request(app)
    .get("/api/conversations")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(list.body.data.length, 2);

  // Most recently active first.
  assert.equal(list.body.data[0]._id, firstId);

  const firstDetail = await request(app)
    .get(`/api/conversations/${firstId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  const secondDetail = await request(app)
    .get(`/api/conversations/${secondId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    firstDetail.body.data.messages.length,
    4
  );

  assert.equal(
    secondDetail.body.data.messages.length,
    2
  );

  const secondContents =
    secondDetail.body.data.messages.map(
      (m) => m.content
    );

  assert.ok(
    !secondContents.includes(
      "still conversation one"
    ),
    "messages must not leak between conversations"
  );
});

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
*/

test("groq and gemini can both be selected explicitly", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const groq = await send(token, {
    message: "hello groq",
    provider: "groq",
    conversationId: null,
  }).expect(200);

  assert.equal(groq.body.data.provider, "groq");

  const gemini = await send(token, {
    message: "hello gemini",
    provider: "gemini",
    conversationId: null,
  }).expect(200);

  assert.equal(
    gemini.body.data.provider,
    "gemini"
  );
});

test("an unsupported provider is rejected by validation", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  await send(token, {
    message: "hello",
    provider: "openai",
    conversationId: null,
  }).expect(400);
});

test("auto falls back to the next provider when the first fails", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const restore = await stubProvider(
    "groq",
    failingProvider("groq is down")
  );

  try {
    const response = await send(token, {
      message: "hello",
      provider: "auto",
      conversationId: null,
    }).expect(200);

    assert.equal(
      response.body.data.provider,
      "gemini",
      "auto must fall through groq to gemini"
    );
  } finally {
    restore();
  }
});

/*
|--------------------------------------------------------------------------
| AI failure must not orphan a conversation
|--------------------------------------------------------------------------
|
| This is the regression test for the duplicate-conversation bug: a failed
| turn still returns the conversationId, so the next message continues the
| same conversation instead of starting a new one.
*/

test("an AI failure returns the conversationId and does not duplicate the conversation", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const restoreGroqFail = await stubProvider(
    "groq",
    failingProvider("groq is down")
  );

  const restoreGeminiFail = await stubProvider(
    "gemini",
    failingProvider("gemini is down")
  );

  let conversationId;

  try {
    const failed = await send(token, {
      message: "hello",
      provider: "auto",
      conversationId: null,
    });

    assert.ok(
      failed.status >= 500,
      `expected a 5xx, got ${failed.status}`
    );

    assert.equal(failed.body.success, false);

    conversationId =
      failed.body.data?.conversationId;

    assert.ok(
      conversationId,
      "the error response must still carry the conversationId"
    );
  } finally {
    restoreGroqFail();
    restoreGeminiFail();
  }

  // The client adopts that id; the retry continues the same conversation.
  const retry = await send(token, {
    message: "hello again",
    provider: "auto",
    conversationId,
  }).expect(200);

  assert.equal(
    retry.body.data.conversationId,
    conversationId
  );

  const list = await request(app)
    .get("/api/conversations")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    list.body.data.length,
    1,
    "a failed turn must not leave a second conversation behind"
  );

  // The user's first message survived the provider failure.
  const detail = await request(app)
    .get(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    detail.body.data.messages[0].content,
    "hello"
  );
});

/*
|--------------------------------------------------------------------------
| Validation and contract
|--------------------------------------------------------------------------
*/

test("the validator preserves conversationId instead of stripping it", options, async () => {
  const { chatSchema } = await import(
    "../src/validators/chat.validator.js"
  );

  const parsed = chatSchema.parse({
    message: "hello",
    provider: "groq",
    conversationId: "0123456789abcdef01234567",
  });

  assert.equal(
    parsed.conversationId,
    "0123456789abcdef01234567",
    "conversationId must survive validation"
  );

  assert.equal(
    chatSchema.parse({ message: "hello" })
      .conversationId,
    null
  );

  assert.equal(
    chatSchema.parse({
      message: "hello",
      conversationId: "",
    }).conversationId,
    null
  );
});

test("an empty message is rejected", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  await send(token, {
    message: "   ",
    conversationId: null,
  }).expect(400);
});

test("the success response matches the documented contract", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const response = await send(token, {
    message: "hello",
    conversationId: null,
  }).expect(200);

  assert.equal(response.body.success, true);

  assert.deepEqual(
    Object.keys(response.body.data).sort(),
    [
      "content",
      "conversationId",
      "latencyMs",
      "model",
      "provider",
    ]
  );

  assert.equal(
    typeof response.body.data.latencyMs,
    "number"
  );
});

/*
|--------------------------------------------------------------------------
| Deletion
|--------------------------------------------------------------------------
*/

test("deleting a conversation removes its messages too", options, async () => {
  const { token } = await createUserAndLogin(
    request,
    app
  );

  const created = await send(token, {
    message: "hello",
    conversationId: null,
  }).expect(200);

  const conversationId =
    created.body.data.conversationId;

  await request(app)
    .delete(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  const { default: Message } = await import(
    "../src/models/Message.js"
  );

  const remaining = await Message.countDocuments({
    conversation: conversationId,
  });

  assert.equal(
    remaining,
    0,
    "messages must not be orphaned"
  );

  await request(app)
    .get(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(404);
});

/*
|--------------------------------------------------------------------------
| Legacy data
|--------------------------------------------------------------------------
|
| Conversations created before messages moved to their own collection must
| still open correctly.
*/

test("legacy embedded messages are migrated on first read", options, async () => {
  const { token, user } = await createUserAndLogin(
    request,
    app
  );

  const mongoose = (await import("mongoose")).default;

  const { default: Conversation } = await import(
    "../src/models/Conversation.js"
  );

  const legacyId = new mongoose.Types.ObjectId();

  await Conversation.collection.insertOne({
    _id: legacyId,
    user: new mongoose.Types.ObjectId(user.id),
    title: "Legacy chat",
    provider: "groq",
    messages: [
      {
        role: "user",
        content: "old question",
        createdAt: new Date("2024-01-01T10:00:00Z"),
      },
      {
        role: "assistant",
        content: "old answer",
        provider: "groq",
        model: "legacy-model",
        createdAt: new Date("2024-01-01T10:00:05Z"),
      },
    ],
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:05Z"),
  });

  const detail = await request(app)
    .get(`/api/conversations/${legacyId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    detail.body.data.messages.length,
    2
  );

  assert.equal(
    detail.body.data.messages[0].content,
    "old question"
  );

  assert.equal(
    detail.body.data.messages[1].content,
    "old answer"
  );

  // The migrated conversation continues normally.
  const continued = await send(token, {
    message: "follow up",
    conversationId: legacyId.toString(),
  }).expect(200);

  assert.equal(
    continued.body.data.conversationId,
    legacyId.toString()
  );

  const after = await request(app)
    .get(`/api/conversations/${legacyId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(
    after.body.data.messages.length,
    4
  );
});

/*
|--------------------------------------------------------------------------
| Retry
|--------------------------------------------------------------------------
|
| The user turn is persisted before the provider is called, so a retry must
| regenerate a reply for it rather than writing the message a second time.
*/

test("retrying a failed message does not duplicate the user turn", options, async () => {
  const { token } = await createUserAndLogin(request, app);

  const restoreGroq = await stubProvider(
    "groq",
    failingProvider("groq is down")
  );

  const restoreGemini = await stubProvider(
    "gemini",
    failingProvider("gemini is down")
  );

  let conversationId;

  try {
    const failed = await send(token, {
      message: "explain closures",
      conversationId: null,
    });

    conversationId = failed.body.data.conversationId;

    assert.ok(conversationId);
  } finally {
    restoreGroq();
    restoreGemini();
  }

  const retried = await send(token, {
    message: "explain closures",
    conversationId,
    retry: true,
  }).expect(200);

  assert.equal(
    retried.body.data.conversationId,
    conversationId
  );

  const detail = await request(app)
    .get(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  const messages = detail.body.data.messages;

  assert.deepEqual(
    messages.map((m) => m.role),
    ["user", "assistant"],
    "the user turn must appear exactly once"
  );

  assert.equal(messages[0].content, "explain closures");
});

test("a retry is refused when the last turn is not awaiting a reply", options, async () => {
  const { token } = await createUserAndLogin(request, app);

  const created = await send(token, {
    message: "hello",
    conversationId: null,
  }).expect(200);

  const conversationId = created.body.data.conversationId;

  // The conversation already ends with an assistant reply.
  await send(token, {
    message: "hello",
    conversationId,
    retry: true,
  }).expect(409);
});

test("a retry cannot target another user's conversation", options, async () => {
  const alice = await createUserAndLogin(request, app);
  const bob = await createUserAndLogin(request, app);

  const created = await send(alice.token, {
    message: "alice message",
    conversationId: null,
  }).expect(200);

  await send(bob.token, {
    message: "intrusion",
    conversationId: created.body.data.conversationId,
    retry: true,
  }).expect(404);
});

/*
|--------------------------------------------------------------------------
| Sidebar pagination
|--------------------------------------------------------------------------
*/

test("the conversation list pages with a stable cursor", options, async () => {
  const { token } = await createUserAndLogin(request, app);

  for (let i = 0; i < 5; i += 1) {
    await send(token, {
      message: `conversation ${i}`,
      conversationId: null,
    }).expect(200);
  }

  const firstPage = await request(app)
    .get("/api/conversations")
    .query({ limit: 2 })
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(firstPage.body.data.length, 2);
  assert.equal(firstPage.body.pagination.hasMore, true);
  assert.ok(firstPage.body.pagination.nextCursor);

  const secondPage = await request(app)
    .get("/api/conversations")
    .query({
      limit: 2,
      before: firstPage.body.pagination.nextCursor,
    })
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(secondPage.body.data.length, 2);

  // Pages must not overlap.
  const firstIds = firstPage.body.data.map((c) => c._id);
  const secondIds = secondPage.body.data.map((c) => c._id);

  assert.equal(
    firstIds.filter((id) => secondIds.includes(id)).length,
    0,
    "pages must not repeat conversations"
  );

  const lastPage = await request(app)
    .get("/api/conversations")
    .query({
      limit: 10,
      before: secondPage.body.pagination.nextCursor,
    })
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(lastPage.body.data.length, 1);
  assert.equal(lastPage.body.pagination.hasMore, false);
  assert.equal(lastPage.body.pagination.nextCursor, null);
});

/*
|--------------------------------------------------------------------------
| Rename
|--------------------------------------------------------------------------
*/

test("a conversation can be renamed by its owner only", options, async () => {
  const alice = await createUserAndLogin(request, app);
  const bob = await createUserAndLogin(request, app);

  const created = await send(alice.token, {
    message: "original message",
    conversationId: null,
  }).expect(200);

  const conversationId = created.body.data.conversationId;

  const renamed = await request(app)
    .patch(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${alice.token}`)
    .send({ title: "  Renamed chat  " })
    .expect(200);

  assert.equal(renamed.body.data.title, "Renamed chat");

  await request(app)
    .patch(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${bob.token}`)
    .send({ title: "hijacked" })
    .expect(404);
});

/*
|--------------------------------------------------------------------------
| Registration
|--------------------------------------------------------------------------
*/

test("registration returns a token that works immediately", options, async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Fresh User",
      email: `fresh-${Date.now()}@example.com`,
      password: "password123",
    })
    .expect(201);

  assert.ok(
    response.body.token,
    "register must sign the user in"
  );

  await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${response.body.token}`)
    .expect(200);
});
