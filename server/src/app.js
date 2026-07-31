import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());
app.use("/api/auth", authRoutes);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Enterprise AI Chatbot API is running 🚀",
  });
});

export default app;