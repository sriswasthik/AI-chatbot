import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Check,
  Copy,
  User,
} from "lucide-react";

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  }

  function formatTime(date) {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      className={`group flex gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
          <Bot size={17} />
        </div>
      )}

      <div
        className={`flex max-w-[80%] flex-col ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {!isUser &&
          (message.provider ||
            message.model ||
            message.latencyMs) && (
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {message.provider && (
                <span className="capitalize">
                  {message.provider}
                </span>
              )}

              {message.model && (
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-400">
                  {message.model}
                </span>
              )}

              {message.latencyMs && (
                <span>
                  {message.latencyMs} ms
                </span>
              )}
            </div>
          )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : "border border-slate-800 bg-slate-900 text-slate-100"
          }`}
        >
          <div className="prose prose-invert max-w-none break-words text-sm">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        <div
          className={`mt-1 flex items-center gap-2 ${
            isUser
              ? "flex-row-reverse"
              : "flex-row"
          }`}
        >
          {message.createdAt && (
            <span className="text-[11px] text-slate-600">
              {formatTime(message.createdAt)}
            </span>
          )}

          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy response"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 opacity-0 transition hover:bg-slate-800 hover:text-slate-300 group-hover:opacity-100"
            >
              {copied ? (
                <Check
                  size={14}
                  className="text-emerald-400"
                />
              ) : (
                <Copy size={14} />
              )}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
          <User size={17} />
        </div>
      )}
    </div>
  );
}