import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { useChat } from "../../hooks/useChat";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  const { sendMessage, loading } = useChat();

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      160
    )}px`;
  }, [input]);

  async function handleSubmit() {
    const message = input.trim();

    if (!message || loading) return;

    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(message);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-slate-800 bg-gray-950 p-3 sm:p-4">
      <div className="mx-auto flex max-w-4xl items-end gap-2 sm:gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask anything..."
          maxLength={4000}
          disabled={loading}
          className="
            max-h-40
            min-h-[48px]
            flex-1
            resize-none
            overflow-y-auto
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-4
            py-3
            text-white
            outline-none
            transition
            placeholder:text-slate-500
            focus:border-blue-500
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-blue-600
            text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:bg-slate-700
            disabled:text-slate-500
          "
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-slate-600">
        <span className="hidden sm:inline">
          Enter to send · Shift + Enter for new line
        </span>
        <span className="sm:hidden">Tap send to submit</span>
      </p>
    </div>
  );
}