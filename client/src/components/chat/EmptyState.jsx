import { Bot } from "lucide-react";

/*
| Suggested prompts give a new user something to click instead of facing a
| blank composer.
*/

const SUGGESTIONS = [
  "Explain closures in JavaScript",
  "Write a SQL query to find duplicate rows",
  "Summarise the SOLID principles",
  "Help me debug a failing test",
];

export default function EmptyState({ onPick }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-400">
        <Bot size={34} />
      </div>

      <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
        Enterprise AI Chatbot
      </h2>

      <p className="mt-2 max-w-md text-sm text-slate-400 sm:text-base">
        Ask anything. Responses are powered by multiple AI models.
      </p>

      {onPick && (
        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onPick(suggestion)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
