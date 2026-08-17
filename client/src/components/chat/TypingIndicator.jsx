import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
        <Bot size={17} />
      </div>

      <div
        className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4"
        role="status"
        aria-label="Assistant is typing"
      >
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
      </div>
    </div>
  );
}
