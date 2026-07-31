import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
==========================================
🚀 Enterprise AI Chatbot API Started
🌐 http://localhost:${PORT}
==========================================
`);
});