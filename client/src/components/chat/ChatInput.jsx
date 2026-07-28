import { Send } from "lucide-react";

export default function ChatInput() {
  return (
    <div className="border-t border-gray-800 p-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Ask anything..."
          className="flex-1 rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 outline-none"
        />

        <button
          className="bg-blue-600 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}