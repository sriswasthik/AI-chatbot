import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

import { useChat } from "../../hooks/useChat";

export default function ChatInput() {
  const [input, setInput] = useState("");

  const { sendMessage, loading } = useChat();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const message = input;

    setInput("");

    await sendMessage(message);
  }

  return (
    <div className="border-t border-gray-800 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={loading}
          className="flex-1 rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 outline-none disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
}