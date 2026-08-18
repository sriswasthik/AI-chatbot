/*
|--------------------------------------------------------------------------
| HTTP layer tests
|--------------------------------------------------------------------------
|
| Exercises the real Express app: routing, CORS, helmet, authentication and
| request validation. None of these paths reach MongoDB -- auth only
| verifies a JWT and validation runs before the controller -- so this file
| runs without a database.
*/

import test, { before } from "node:test";
import assert from "node:assert/strict";

import request from "supertest";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-suite-only";
process.env.GROQ_API_KEY = "test-groq-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.CLIENT_URL = "http://localhost:5173";

let app;

before(async () => {
  ({ default: app } = await import("../src/app.js"));
});

function tokenFor(id = "0123456789abcdef01234567") {
  return jwt.sign(
    { id, email: "t@example.com", role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function chat(token, body) {
  return request(app)
    .post("/api/chat")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

/*
|--------------------------------------------------------------------------
| Routing
|--------------------------------------------------------------------------
*/

test("the health check responds", async () => {
  const response = await request(app)
    .get("/")
    .expect(200);

  assert.equal(response.body.success, true);
});

test("an unknown route returns a 404 envelope", async () => {
  const response = await request(app)
    .get("/api/does-not-exist")
    .expect(404);

  assert.equal(response.body.success, false);

  assert.match(
    response.body.message,
    /Route not found/
  );
});

test("chat is registered for POST only", async () => {
  await request(app).get("/api/chat").expect(404);
});

/*
|--------------------------------------------------------------------------
| Security headers
|--------------------------------------------------------------------------
*/

test("helmet headers are applied", async () => {
  const response = await request(app)
    .get("/")
    .expect(200);

  assert.ok(
    response.headers["x-content-type-options"],
    "expected helmet to set x-content-type-options"
  );
});

test("CORS allows the configured client origin", async () => {
  const response = await request(app)
    .get("/")
    .set("Origin", "http://localhost:5173")
    .expect(200);

  assert.equal(
    response.headers["access-control-allow-origin"],
    "http://localhost:5173"
  );
});

test("CORS does not echo an unlisted origin", async () => {
  const response = await request(app)
    .get("/")
    .set("Origin", "http://evil.example.com");

  assert.notEqual(
    response.headers["access-control-allow-origin"],
    "http://evil.example.com"
  );
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| The user id always comes from the verified token. Nothing in the request
| body can influence whose data is touched.
*/

test("chat requires a token", async () => {
  await request(app)
    .post("/api/chat")
    .send({ message: "hello" })
    .expect(401);
});

test("a malformed Authorization header is rejected", async () => {
  await request(app)
    .post("/api/chat")
    .set("Authorization", "NotBearer abc")
    .send({ message: "hello" })
    .expect(401);
});

test("a token signed with the wrong secret is rejected", async () => {
  const forged = jwt.sign(
    { id: "0123456789abcdef01234567" },
    "the-wrong-secret"
  );

  await chat(forged, { message: "hello" }).expect(
    401
  );
});

test("an expired token is rejected", async () => {
  const expired = jwt.sign(
    { id: "0123456789abcdef01234567" },
    process.env.JWT_SECRET,
    { expiresIn: -10 }
  );

  await chat(expired, { message: "hello" }).expect(
    401
  );
});

test("conversation routes require a token", async () => {
  await request(app)
    .get("/api/conversations")
    .expect(401);

  await request(app)
    .delete(
      "/api/conversations/0123456789abcdef01234567"
    )
    .expect(401);
});

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
|
| Validation runs before the controller, so these never touch the database.
*/

test("an empty message is rejected before reaching the controller", async () => {
  const response = await chat(tokenFor(), {
    message: "   ",
  }).expect(400);

  assert.equal(response.body.success, false);
});

test("an oversized message is rejected", async () => {
  await chat(tokenFor(), {
    message: "x".repeat(4001),
  }).expect(400);
});

test("a malformed conversationId is rejected with 400", async () => {
  const response = await chat(tokenFor(), {
    message: "hello",
    conversationId: "not-an-object-id",
  }).expect(400);

  assert.match(
    response.body.message,
    /conversation id/i
  );
});

test("a removed provider is rejected", async () => {
  await chat(tokenFor(), {
    message: "hello",
    provider: "openai",
  }).expect(400);

  await chat(tokenFor(), {
    message: "hello",
    provider: "openrouter",
  }).expect(400);
});

/*
|--------------------------------------------------------------------------
| Auth route registration
|--------------------------------------------------------------------------
|
| register/login used to be mounted twice, with the duplicates missing the
| rate limiter. Confirm each path resolves to exactly one handler.
*/

test("auth routes are registered exactly once", async () => {
  /*
  | Checked per mounted router. Comparing across routers would flag
  | "POST /" on /api/chat against "POST /" on /api/conversations, which
  | are different endpoints.
  */

  const routers = app.router.stack.filter(
    (layer) => layer.name === "router"
  );

  const duplicates = [];

  for (const router of routers) {
    const counts = {};

    for (const layer of router.handle.stack || []) {
      if (!layer.route) continue;

      for (const method of Object.keys(
        layer.route.methods
      )) {
        const key = `${method} ${layer.route.path}`;

        counts[key] = (counts[key] || 0) + 1;
      }
    }

    for (const [key, count] of Object.entries(
      counts
    )) {
      if (count > 1) {
        duplicates.push([key, count]);
      }
    }
  }

  assert.deepEqual(
    duplicates,
    [],
    `duplicate route registrations: ${JSON.stringify(
      duplicates
    )}`
  );
});

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

test("health reports degraded with a 503 when the database is down", async () => {
  /*
  | No mongoose connection is established in this file, so this exercises
  | the unhealthy branch a load balancer would use to pull the instance.
  */

  const response = await request(app)
    .get("/api/health")
    .expect(503);

  assert.equal(response.body.status, "degraded");
  assert.equal(response.body.database, "disconnected");
  assert.equal(typeof response.body.uptimeSeconds, "number");
  assert.deepEqual(
    response.body.providers.sort(),
    ["gemini", "groq"]
  );
});

test("health is not behind the rate limiter", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(
    response.headers["ratelimit-limit"],
    undefined,
    "monitoring probes must not consume the API rate limit"
  );
});

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
*/

test("providers lists only configured providers and requires auth", async () => {
  await request(app).get("/api/chat/providers").expect(401);

  const response = await request(app)
    .get("/api/chat/providers")
    .set("Authorization", `Bearer ${tokenFor()}`)
    .expect(200);

  assert.deepEqual(
    response.body.data.providers.sort(),
    ["gemini", "groq"]
  );

  assert.equal(response.body.data.default, "auto");
});

/*
|--------------------------------------------------------------------------
| Conversation validation
|--------------------------------------------------------------------------
|
| These 400s are produced by the validator, before any database access.
*/

function conversations(method, path = "") {
  return request(app)
    [method](`/api/conversations${path}`)
    .set("Authorization", `Bearer ${tokenFor()}`);
}

test("a non-string conversation title is rejected", async () => {
  await conversations("post")
    .send({ title: { $ne: null } })
    .expect(400);

  await conversations("patch", "/0123456789abcdef01234567")
    .send({ title: { $gt: "" } })
    .expect(400);
});

test("an empty or oversized title is rejected", async () => {
  await conversations("post").send({ title: "   " }).expect(400);

  await conversations("post")
    .send({ title: "x".repeat(101) })
    .expect(400);
});

test("an empty PATCH body is rejected", async () => {
  const response = await conversations(
    "patch",
    "/0123456789abcdef01234567"
  )
    .send({})
    .expect(400);

  assert.match(response.body.message, /Nothing to update/);
});

test("an unsupported provider on a conversation is rejected", async () => {
  await conversations("post")
    .send({ provider: "openai" })
    .expect(400);
});

test("an out-of-range pagination limit is rejected", async () => {
  await conversations("get").query({ limit: 0 }).expect(400);
  await conversations("get").query({ limit: 500 }).expect(400);
  await conversations("get")
    .query({ before: "not-a-date" })
    .expect(400);
});

/*
|--------------------------------------------------------------------------
| Retry validation
|--------------------------------------------------------------------------
*/

test("a retry without a conversationId is rejected", async () => {
  const response = await chat(tokenFor(), {
    message: "hello",
    retry: true,
  }).expect(400);

  assert.match(response.body.message, /retry requires/i);
});
