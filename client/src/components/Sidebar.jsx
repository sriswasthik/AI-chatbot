import { useState } from "react";
import {
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { useChat } from "../hooks/useChat";

export default function Sidebar() {
  const {
    conversations,
    conversationsLoading,
    conversationId,
    loadConversation,
    clearChat,
    removeConversation,
  } = useChat();

  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(event, id) {
    // Keep the row click from also opening the conversation.
    event.stopPropagation();

    setDeletingId(id);

    try {
      await removeConversation(id);

      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
      {/* New Chat */}
      <div className="p-4">
        <button
          type="button"
          onClick={clearChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-800 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Conversations
        </p>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {conversationsLoading &&
          conversations.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-slate-500">
              No conversations yet.
            </p>
          ) : (
            conversations.map((conversation) => {
              const id = conversation._id;

              const isActive = id === conversationId;

              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadConversation(id)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      loadConversation(id);
                    }
                  }}
                  className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare
                    size={17}
                    className="flex-shrink-0"
                  />

                  <span className="min-w-0 flex-1 truncate">
                    {conversation.title || "New Chat"}
                  </span>

                  <button
                    type="button"
                    onClick={(event) =>
                      handleDelete(event, id)
                    }
                    disabled={deletingId === id}
                    title="Delete conversation"
                    aria-label={`Delete ${
                      conversation.title || "conversation"
                    }`}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-slate-500 opacity-0 transition hover:bg-slate-700 hover:text-red-400 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deletingId === id ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
