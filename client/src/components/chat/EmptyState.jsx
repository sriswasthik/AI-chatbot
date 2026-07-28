import { Bot } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Bot size={60} />

      <h2 className="text-3xl font-bold mt-4">
        Enterprise AI Chatbot
      </h2>

      <p className="text-gray-400 mt-2">
        Start a conversation with Azure OpenAI.
      </p>
    </div>
  );
}