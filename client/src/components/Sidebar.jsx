import { useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useChat } from "../hooks/useChat";

export default function Sidebar({ open = false, onClose }) {
  const {
    conversations,
    conversationsLoading,
    conversationId,
    loadConversation,
    clearChat,
    removeConversation,
    renameConversation,
    loadMoreConversations,
    hasMoreConversations,
    loadingMore,
  } = useChat();

  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  function handleSelect(id) {
    loadConversation(id);

    // On mobile the drawer covers the chat, so selecting must dismiss it.
    onClose?.();
  }

  function handleNewChat() {
    clearChat();
    onClose?.();
  }

  async function handleDelete(event, id) {
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

  function startRename(event, conversation) {
    event.stopPropagation();

    setEditingId(conversation._id);
    setDraftTitle(conversation.title || "");
  }

  async function commitRename(id) {
    const title = draftTitle.trim();

    setEditingId(null);

    const current = conversations.find((c) => c._id === id);

    if (!title || title === current?.title) return;

    try {
      await renameConversation(id, title);
    } catch {
      toast.error("Failed to rename conversation");
    }
  }

  return (
    <>
      {/*
        Backdrop for the mobile drawer. Hidden from md up, where the
        sidebar is a permanent column.
      */}
      {open && (
        <button
          type="button"
          aria-label="Close conversations"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200 md:static md:z-auto md:w-64 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 p-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New Chat
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversations"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col border-t border-slate-800 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Conversations
          </p>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {conversationsLoading && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-slate-500">
                No conversations yet.
              </p>
            ) : (
              <>
                {conversations.map((conversation) => {
                  const id = conversation._id;

                  const isActive = id === conversationId;
                  const isEditing = editingId === id;

                  if (isEditing) {
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-2"
                      >
                        <input
                          ref={inputRef}
                          value={draftTitle}
                          onChange={(event) =>
                            setDraftTitle(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitRename(id);
                            }

                            if (event.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          onBlur={() => commitRename(id)}
                          maxLength={100}
                          className="min-w-0 flex-1 rounded bg-slate-950 px-2 py-1 text-sm text-white outline-none ring-1 ring-blue-500"
                        />

                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => commitRename(id)}
                          aria-label="Save title"
                          className="flex h-6 w-6 items-center justify-center rounded text-emerald-400 hover:bg-slate-700"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect(id)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          handleSelect(id);
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

                      {/*
                        Always visible on touch devices, which have no
                        hover state to reveal them.
                      */}
                      <button
                        type="button"
                        onClick={(event) =>
                          startRename(event, conversation)
                        }
                        aria-label={`Rename ${
                          conversation.title || "conversation"
                        }`}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-slate-500 transition hover:bg-slate-700 hover:text-slate-200 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => handleDelete(event, id)}
                        disabled={deletingId === id}
                        aria-label={`Delete ${
                          conversation.title || "conversation"
                        }`}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-slate-500 transition hover:bg-slate-700 hover:text-red-400 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                      >
                        {deletingId === id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  );
                })}

                {hasMoreConversations && (
                  <button
                    type="button"
                    onClick={loadMoreConversations}
                    disabled={loadingMore}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "Load older conversations"
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
