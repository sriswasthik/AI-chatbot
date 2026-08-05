import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import {
  notFound,
  errorHandler,
} from "./middleware/error.middleware.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(helmet());

app.use(morgan("dev"));

app.use(
  express.json({
    limit: "10kb",
  })
);
app.use("/api/auth", authRoutes);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

app.use(limiter);


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Enterprise AI Chatbot API is running 🚀",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;