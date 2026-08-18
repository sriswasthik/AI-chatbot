import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import mongoose from "mongoose";

import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/error.middleware.js";

import { getConfiguredProviders } from "./services/ai/provider.registry.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(helmet());

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

/*
| Allowed origins come from CLIENT_URL (comma-separated for multiple
| deployments) so this does not have to be edited per environment.
*/

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| Body Parser
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

/*
| Real health check for load balancers and uptime monitoring. Reports 503
| while the database is unreachable so an instance that cannot serve
| traffic is taken out of rotation instead of returning 500s to users.
*/

const DB_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

app.get("/api/health", (req, res) => {
  const state = mongoose.connection.readyState;

  const database = DB_STATES[state] || "unknown";

  const healthy = state === 1;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "ok" : "degraded",
    uptimeSeconds: Math.round(process.uptime()),
    database,
    providers: getConfiguredProviders(),
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| Rate Limiting
|--------------------------------------------------------------------------
*/

app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    message:
      "Enterprise AI Chatbot API is running",
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);

app.use(
  "/api/conversations",
  conversationRoutes
);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFound);

app.use(errorHandler);

export default app;