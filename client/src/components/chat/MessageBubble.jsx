import { memo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  RotateCcw,
  User,
} from "lucide-react";

import Markdown from "./Markdown";

function MessageBubble({ message, onRetry }) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";
  const isError = Boolean(message.isError);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
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

  const hasMeta =
    !isUser &&
    !isError &&
    (message.provider || message.model || message.latencyMs);

  return (
    <div
      className={`group flex gap-2 sm:gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
            isError
              ? "bg-red-500/15 text-red-400"
              : "bg-emerald-600/20 text-emerald-400"
          }`}
        >
          {isError ? <AlertTriangle size={16} /> : <Bot size={17} />}
        </div>
      )}

      <div
        className={`flex min-w-0 max-w-[88%] flex-col sm:max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {hasMeta && (
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {message.provider && (
              <span className="capitalize">{message.provider}</span>
            )}

            {message.model && (
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-400">
                {message.model}
              </span>
            )}

            {message.latencyMs != null && (
              <span>{message.latencyMs} ms</span>
            )}
          </div>
        )}

        <div
          className={`min-w-0 rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : isError
                ? "border border-red-500/40 bg-red-500/10 text-red-200"
                : "border border-slate-800 bg-slate-900 text-slate-100"
          }`}
        >
          {/*
            User text is shown verbatim -- rendering it as markdown would
            mangle anything that happens to contain markdown syntax.
          */}
          {isUser || isError ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="break-words text-sm">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
        </div>

        <div
          className={`mt-1 flex items-center gap-1 ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {message.createdAt && (
            <span className="px-1 text-[11px] text-slate-600">
              {formatTime(message.createdAt)}
            </span>
          )}

          {/*
            Controls are always reachable on touch devices, where there is
            no hover; they only fade in on pointer devices.
          */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy message"
            aria-label="Copy message"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          {isError && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              title="Retry"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
            >
              <RotateCcw size={12} />
              Retry
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

/*
| Rendering a long transcript re-parses every bubble's markdown on any
| provider update. Messages are immutable once added, so memoising cuts
| that to only genuinely changed bubbles.
*/

export default memo(MessageBubble);
