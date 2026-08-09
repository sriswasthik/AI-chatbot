import {
  MessageSquare,
  Plus,
  Loader2,
} from "lucide-react";

import { useChat } from "../hooks/useChat";

export default function Sidebar() {
  const {
    conversations,
    conversationsLoading,
    conversationId,
    loadConversation,
    clearChat,
  } = useChat();

  function handleNewChat() {
    clearChat();
  }

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
      {/* New Chat */}
      <div className="p-4">
        <button
          type="button"
          onClick={handleNewChat}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-blue-600
            px-4
            py-2.5
            font-medium
            text-white
            transition
            hover:bg-blue-700
          "
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="min-h-0 flex-1 border-t border-slate-800 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Conversations
        </p>

        <div className="h-full space-y-1 overflow-y-auto">
          {conversationsLoading ? (
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
              const isActive =
                conversation._id ===
                conversationId;

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() =>
                    loadConversation(
                      conversation._id
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-3
                    text-left
                    text-sm
                    transition
                    ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }
                  `}
                >
                  <MessageSquare
                    size={17}
                    className="flex-shrink-0"
                  />

                  <span className="truncate">
                    {conversation.title ||
                      "New Chat"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}