import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`
==========================================
Enterprise AI Chatbot API Started
http://localhost:${PORT}
==========================================
      `);
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();