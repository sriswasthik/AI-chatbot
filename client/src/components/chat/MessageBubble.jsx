import ReactMarkdown from "react-markdown";
import { Bot, User, Zap } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex gap-3 max-w-4xl ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isUser
              ? "bg-blue-600"
              : "bg-emerald-600"
          }`}
        >
          {isUser ? (
            <User size={18} />
          ) : (
            <Bot size={18} />
          )}
        </div>

        <div className="space-y-2">
          {/* Header */}
          {!isUser && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium capitalize">
                {message.provider || "AI"}
              </span>

              {message.model && (
                <span className="px-2 py-0.5 rounded-full bg-gray-800">
                  {message.model}
                </span>
              )}

              {message.latencyMs && (
                <span className="flex items-center gap-1">
                  <Zap size={12} />
                  {message.latencyMs} ms
                </span>
              )}
            </div>
          )}

          {/* Bubble */}
          <div
            className={`rounded-2xl px-5 py-4 ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-100"
            }`}
          >
            <div className="prose prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}