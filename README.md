# Enterprise AI Chatbot

A production-oriented AI chat application: React + Vite on the front end,
Express + MongoDB on the back end, JWT authentication, and a provider
gateway in front of Gemini and Groq.

## Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, Axios        |
| Backend  | Node.js, Express 5 (ESM), Mongoose 9         |
| Database | MongoDB                                     |
| Auth     | JWT (bearer token), bcrypt password hashing |
| AI       | Gemini and Groq behind one gateway          |

## Getting started

```bash
# 1. install
npm run install:all

# 2. configure
cp server/.env.example server/.env      # fill in MONGODB_URI, JWT_SECRET, provider keys
cp client/.env.example client/.env

# 3. run (two terminals)
npm run dev:server                       # http://localhost:5000
npm run dev:client                       # http://localhost:5173
```

The server refuses to start without `MONGODB_URI`, `JWT_SECRET`, and at
least one of `GEMINI_API_KEY` / `GROQ_API_KEY`, so misconfiguration fails
immediately instead of surfacing later as confusing request errors.

## Environment

See `server/.env.example` and `client/.env.example` for the full list.
`CLIENT_URL` accepts a comma-separated list of allowed CORS origins.
`AI_AUTO_PROVIDER_CHAIN` controls the order `provider: "auto"` tries.

## API

All routes below `/api` other than register and login require an
`Authorization: Bearer <token>` header. Ownership is always derived from
the token; the client never supplies a user id.

| Method | Path                     | Purpose                                 |
| ------ | ------------------------ | --------------------------------------- |
| GET    | `/api/health`            | Liveness + database and provider status |
| POST   | `/api/auth/register`     | Create an account (returns a token)     |
| POST   | `/api/auth/login`        | Exchange credentials for a JWT          |
| GET    | `/api/auth/me`           | Current user                            |
| POST   | `/api/chat`              | Send a message, get the AI reply        |
| GET    | `/api/chat/providers`    | Providers that are actually configured  |
| GET    | `/api/conversations`     | List conversations (paginated)          |
| POST   | `/api/conversations`     | Create an empty conversation            |
| GET    | `/api/conversations/:id` | Conversation with messages, oldest first |
| PATCH  | `/api/conversations/:id` | Rename / change provider                |
| DELETE | `/api/conversations/:id` | Delete a conversation and its messages  |

### POST /api/chat

```jsonc
// request
{
  "message": "explain inheritance",
  "provider": "auto",          // "auto" | "gemini" | "groq"
  "model": "optional-model-id",
  "conversationId": null,       // null starts a new conversation
  "retry": false                // regenerate a reply for the stored turn
}
```

```jsonc
// response
{
  "success": true,
  "data": {
    "conversationId": "665f...",
    "content": "...",
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "latencyMs": 812
  }
}
```

`conversationId` is the single canonical name for this value across the
client, the API, and the database. The client stores the returned id and
sends it with every subsequent message, so one chat is one conversation.

Errors use the same envelope with `success: false` and a `message`. When
an AI provider fails, the error response **still includes
`data.conversationId`**, so a failed turn does not strand the client
without an id and cause the next message to open a second conversation.

| Situation                                | Status |
| ---------------------------------------- | ------ |
| Missing/invalid token                    | 401    |
| Invalid body or malformed conversationId | 400    |
| Conversation missing or owned by someone else | 404 |
| Provider failed or timed out             | 502 / 504 |
| Retry with no user turn awaiting a reply | 409    |

A `conversationId` that is present but unusable is always an error. It is
never downgraded into "create a new conversation".

### Retry

`retry: true` regenerates a reply for the user message already stored at
the end of the conversation. The user turn is **not** written again, so
retrying a failed send does not duplicate what the user typed. It requires
a `conversationId`, and returns 409 if the conversation does not currently
end with a user message.

### Pagination

`GET /api/conversations` accepts `limit` (1-100, default 50) and `before`
(an ISO timestamp) and returns a `pagination` block:

```jsonc
{ "hasMore": true, "nextCursor": "2026-08-18T09:12:44.101Z" }
```

Keyset pagination on `updatedAt` rather than an offset, so rows reordering
between requests cannot cause a conversation to be skipped or repeated.

## Data model

```
User  1 ──── n  Conversation  1 ──── n  Message
```

- **Conversation** — `user`, `title`, `provider`, timestamps.
  Indexed on `{ user, updatedAt }` for the sidebar.
- **Message** — `conversation`, `role`, `content`, `provider`, `model`,
  `latencyMs`, timestamps. Indexed on `{ conversation, createdAt }`.

Messages live in their own collection rather than embedded in the
conversation, so a long chat does not rewrite one growing document on
every turn or run into the 16MB document limit. Conversations written by
older versions of the app still had embedded messages; those are migrated
automatically the first time the conversation is opened.

## Interface

The sidebar is a permanent column from the `md` breakpoint up and an
overlay drawer below it, opened from the navbar and dismissed by the
backdrop, the close button, Escape, or selecting a conversation. Row
actions (rename, delete) are always visible on touch devices, which have
no hover state to reveal them.

Assistant replies are rendered as markdown: headings, lists, tables, and
fenced code blocks with a language label and a per-block copy button.

## Tests

```bash
npm test                     # from the repo root, or: npm --prefix server test
```

The suite covers the full conversation lifecycle, ownership isolation,
provider fallback, and validation. Database-backed tests need MongoDB:
they use an ephemeral in-memory instance by default, or set
`MONGODB_TEST_URI` to point at a running server. If neither is available
those tests skip with an explanation and the rest still run.
