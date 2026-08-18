import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ChatContext } from "./ChatContext";
import { useAuth } from "../hooks/useAuth";

import {
  sendMessage as sendMessageRequest,
  getProviders,
} from "../services/chat.service";

import {
  getConversations,
  getConversation,
  deleteConversation as deleteConversationRequest,
  updateConversation as updateConversationRequest,
} from "../services/conversation.service";

/*
|--------------------------------------------------------------------------
| Sidebar list normalisation
|--------------------------------------------------------------------------
|
| Deduplicate by conversation id (last write wins) and sort by most recent
| activity, so a refetch racing a local update can never produce two rows
| for the same conversation.
*/

function normalizeConversations(list) {
  const byId = new Map();

  for (const conversation of list || []) {
    if (conversation?._id) {
      byId.set(
        conversation._id.toString(),
        conversation
      );
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.updatedAt || 0) -
      new Date(a.updatedAt || 0)
  );
}

function toClientMessage(message) {
  return {
    id: message._id || crypto.randomUUID(),
    role: message.role,
    content: message.content,
    provider: message.provider,
    model: message.model,
    latencyMs: message.latencyMs,
    createdAt: message.createdAt,
  };
}

export default function ChatProvider({ children }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] =
    useState(false);
  const [conversationLoading, setConversationLoading] =
    useState(false);

  const [conversationId, setConversationId] =
    useState(null);

  const [provider, setProvider] = useState("auto");

  /*
  | Providers the server actually has keys for. Until this loads the UI
  | falls back to "auto", which the gateway always accepts.
  */

  const [availableProviders, setAvailableProviders] =
    useState([]);

  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null,
  });

  const [loadingMore, setLoadingMore] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Synchronous conversation id
  |--------------------------------------------------------------------------
  |
  | `conversationId` state drives rendering, but state updates are async and
  | a send can begin before React has re-rendered. This ref is the source of
  | truth for request building: it is written the instant the backend
  | returns an id, so message #2 always carries the id created by message #1.
  |
  | Every write goes through setActiveConversationId to keep the two in step.
  */

  const conversationIdRef = useRef(null);

  const setActiveConversationId = useCallback((id) => {
    const normalized = id ? id.toString() : null;

    conversationIdRef.current = normalized;

    setConversationId(normalized);

    return normalized;
  }, []);

  /*
  | Guards against concurrent submissions. Set synchronously -- the
  | `loading` state flag cannot do this job because two sends dispatched in
  | the same tick would both observe loading === false, both send
  | conversationId: null, and create two conversations.
  */

  const sendingRef = useRef(false);

  /*
  | Lets an in-flight response know it has been superseded (New Chat or a
  | conversation switch), so a late reply cannot write into the wrong chat.
  */

  const requestIdRef = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | Load all conversations
  |--------------------------------------------------------------------------
  */

  const loadConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);

      const { data, pagination: page } =
        await getConversations();

      setConversations(normalizeConversations(data));

      setPagination(page);
    } catch (error) {
      console.error(
        "Failed to load conversations:",
        error
      );
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  /*
  | Appends the next page. Merged through normalizeConversations, so a row
  | that moved between pages cannot appear twice.
  */

  const loadMoreConversations = useCallback(async () => {
    if (!pagination.hasMore || loadingMore) return;

    try {
      setLoadingMore(true);

      const { data, pagination: page } =
        await getConversations({
          before: pagination.nextCursor,
        });

      setConversations((prev) =>
        normalizeConversations([...prev, ...data])
      );

      setPagination(page);
    } catch (error) {
      console.error(
        "Failed to load more conversations:",
        error
      );
    } finally {
      setLoadingMore(false);
    }
  }, [pagination, loadingMore]);

  /*
  |--------------------------------------------------------------------------
  | Load one conversation
  |--------------------------------------------------------------------------
  |
  | Opening an existing conversation is a pure read -- it never creates
  | anything. Messages arrive from the API already in chronological order.
  */

  const loadConversation = useCallback(
    async (id) => {
      if (!id) return;

      const targetId = id.toString();

      if (targetId === conversationIdRef.current) {
        return;
      }

      const requestId = ++requestIdRef.current;

      /*
      | Select immediately so the sidebar highlights the row while the
      | messages are still loading.
      */

      setActiveConversationId(targetId);

      setMessages([]);

      try {
        setConversationLoading(true);

        const conversation = await getConversation(
          targetId
        );

        // A newer selection won while this was in flight.
        if (requestId !== requestIdRef.current) return;

        setMessages(
          (conversation.messages || []).map(
            toClientMessage
          )
        );

        if (conversation.provider) {
          setProvider(conversation.provider);
        }
      } catch (error) {
        console.error(
          "Failed to load conversation:",
          error
        );

        if (requestId === requestIdRef.current) {
          setMessages([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setConversationLoading(false);
        }
      }
    },
    [setActiveConversationId]
  );

  /*
  |--------------------------------------------------------------------------
  | Auth-driven lifecycle
  |--------------------------------------------------------------------------
  |
  | Conversations are only fetched once a user is present. This also stops
  | the unauthenticated request that used to fire on the login page, and
  | wipes chat state on logout so the next user never sees it.
  */

  useEffect(() => {
    if (!user) {
      conversationIdRef.current = null;
      requestIdRef.current += 1;

      setConversationId(null);
      setConversations([]);
      setMessages([]);

      return;
    }

    loadConversations();

    /*
    | Ask which providers are actually configured. A failure here is not
    | fatal: the selector falls back to "auto".
    */

    getProviders()
      .then((data) =>
        setAvailableProviders(data.providers || [])
      )
      .catch((error) =>
        console.error(
          "Failed to load providers:",
          error
        )
      );
  }, [user, loadConversations]);

  /*
  |--------------------------------------------------------------------------
  | Send message
  |--------------------------------------------------------------------------
  */

  const sendMessage = useCallback(
    async (content, { retry = false } = {}) => {
      const trimmedContent = content.trim();

      // Synchronous guard -- see sendingRef above.
      if (!trimmedContent || sendingRef.current) {
        return;
      }

      sendingRef.current = true;

      const requestId = requestIdRef.current;

      /*
      | Read the id synchronously from the ref, never from state.
      | null here means "new chat" and is the only case in which the
      | backend is allowed to create a conversation.
      */
      const activeConversationId =
        conversationIdRef.current;

      if (!retry) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmedContent,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      setLoading(true);

      try {
        const data = await sendMessageRequest({
          message: trimmedContent,
          provider,
          conversationId: activeConversationId,
          retry,
        });

        /*
        | Adopt the returned id before anything else. On the first message
        | this is the newly created conversation; on later messages it is
        | the same id echoed back.
        */

        const returnedId = data.conversationId
          ? setActiveConversationId(
              data.conversationId
            )
          : activeConversationId;

        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          provider: data.provider,
          model: data.model,
          latencyMs: data.latencyMs,
          createdAt: new Date().toISOString(),
        };

        if (requestId === requestIdRef.current) {
          setMessages((prev) => [
            ...prev,
            assistantMessage,
          ]);
        }

        /*
        | Sidebar: refetch exactly once, and only when this send actually
        | created a conversation. Subsequent messages just move the
        | existing row to the top locally -- no request, no new row, no
        | chance of a duplicate entry.
        */

        if (!activeConversationId && returnedId) {
          await loadConversations();
        } else if (returnedId) {
          setConversations((prev) =>
            normalizeConversations(
              prev.map((conversation) =>
                conversation._id === returnedId
                  ? {
                      ...conversation,
                      updatedAt:
                        new Date().toISOString(),
                    }
                  : conversation
              )
            )
          );
        }
      } catch (error) {
        console.error("Chat request failed:", error);

        /*
        | The backend returns the conversationId even when the AI provider
        | fails, so a failed turn still anchors the chat. Without this the
        | id would stay null and the next message would start a second
        | conversation.
        */

        const failedConversationId =
          error.response?.data?.data?.conversationId;

        if (failedConversationId) {
          setActiveConversationId(
            failedConversationId
          );

          if (!activeConversationId) {
            await loadConversations();
          }
        }

        if (requestId === requestIdRef.current) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                error.response?.data?.message ||
                error.message ||
                "Something went wrong.",
              createdAt: new Date().toISOString(),
              isError: true,

              /*
              | Carried on the bubble so its Retry button knows what to
              | resend, without a separate "last failed message" ref that
              | could drift out of sync with what is on screen.
              */
              retryContent: trimmedContent,
            },
          ]);
        }
      } finally {
        sendingRef.current = false;

        setLoading(false);
      }
    },
    [
      provider,
      loadConversations,
      setActiveConversationId,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Retry a failed message
  |--------------------------------------------------------------------------
  |
  | The user turn is already stored server-side from the attempt that
  | failed, so this asks the backend to regenerate a reply for it rather
  | than sending the text again -- which would duplicate the turn.
  |
  | The error bubble is dropped first so the transcript ends on the user
  | message the retry is answering.
  */

  const retryMessage = useCallback(
    async (messageId) => {
      if (sendingRef.current) return;

      const target = messages.find(
        (message) => message.id === messageId
      );

      if (!target?.retryContent) return;

      setMessages((prev) =>
        prev.filter(
          (message) => message.id !== messageId
        )
      );

      await sendMessage(target.retryContent, {
        retry: Boolean(conversationIdRef.current),
      });
    },
    [messages, sendMessage]
  );

  /*
  |--------------------------------------------------------------------------
  | Rename a conversation
  |--------------------------------------------------------------------------
  |
  | Applied optimistically and rolled back if the request fails, so the
  | sidebar never shows a title the server rejected.
  */

  const renameConversation = useCallback(
    async (id, title) => {
      const targetId = id?.toString();

      const nextTitle = title.trim();

      if (!targetId || !nextTitle) return;

      let previousTitle;

      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation._id !== targetId) {
            return conversation;
          }

          previousTitle = conversation.title;

          return { ...conversation, title: nextTitle };
        })
      );

      try {
        await updateConversationRequest(targetId, {
          title: nextTitle,
        });
      } catch (error) {
        console.error(
          "Failed to rename conversation:",
          error
        );

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === targetId
              ? { ...conversation, title: previousTitle }
              : conversation
          )
        );

        throw error;
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | New Chat
  |--------------------------------------------------------------------------
  |
  | Purely client-side: clears the selection and the transcript. No
  | conversation is created until the first message is actually sent, which
  | is what keeps empty conversations out of the sidebar.
  */

  const clearChat = useCallback(() => {
    // Invalidate any in-flight response so it cannot land in the new chat.
    requestIdRef.current += 1;

    setActiveConversationId(null);

    setMessages([]);
  }, [setActiveConversationId]);

  /*
  |--------------------------------------------------------------------------
  | Delete conversation
  |--------------------------------------------------------------------------
  */

  const removeConversation = useCallback(
    async (id) => {
      const targetId = id?.toString();

      if (!targetId) return;

      try {
        await deleteConversationRequest(targetId);

        setConversations((prev) =>
          prev.filter(
            (conversation) =>
              conversation._id !== targetId
          )
        );

        // Deleting the open conversation resets to an empty chat.
        if (conversationIdRef.current === targetId) {
          clearChat();
        }
      } catch (error) {
        console.error(
          "Failed to delete conversation:",
          error
        );

        throw error;
      }
    },
    [clearChat]
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        provider,
        setProvider,
        conversationId,
        conversations,
        conversationsLoading,
        conversationLoading,
        sendMessage,
        retryMessage,
        clearChat,
        loadConversation,
        loadConversations,
        loadMoreConversations,
        removeConversation,
        renameConversation,
        availableProviders,
        hasMoreConversations: pagination.hasMore,
        loadingMore,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
