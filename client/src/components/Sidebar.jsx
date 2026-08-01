import { MessageSquare, Plus } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900 md:block">
      <div className="p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="border-t border-slate-800 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Conversations
        </p>

        <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-3 text-sm text-slate-300">
          <MessageSquare
            size={17}
            className="text-slate-400"
          />

          <span className="truncate">
            Current conversation
          </span>
        </div>
      </div>
    </aside>
  );
}