import {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { ChatContext } from "./ChatContext";

import {
  sendMessage as sendMessageRequest,
} from "../services/chat.service";

import {
  getConversations,
  getConversation,
} from "../services/conversation.service";

export default function ChatProvider({
  children,
}) {
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] =
    useState([]);

  const [
    conversationsLoading,
    setConversationsLoading,
  ] = useState(false);

  const [
    conversationLoading,
    setConversationLoading,
  ] = useState(false);

  const [conversationId, setConversationId] =
    useState(null);

  const conversationIdRef = useRef(null);

  const [provider, setProvider] =
    useState("auto");

  /*
  |--------------------------------------------------------------------------
  | Load all conversations
  |--------------------------------------------------------------------------
  */

  const loadConversations = useCallback(
    async () => {
      try {
        setConversationsLoading(true);

        const response =
          await getConversations();

        setConversations(
          response.data || []
        );
      } catch (error) {
        console.error(
          "Failed to load conversations:",
          error
        );
      } finally {
        setConversationsLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Load one conversation
  |--------------------------------------------------------------------------
  */

  const loadConversation = useCallback(
    async (id) => {
      if (!id) return;

      try {
        setConversationLoading(true);

        const response =
          await getConversation(id);

        const conversation =
          response.data;

        const idString =
          conversation._id?.toString();

        conversationIdRef.current =
          idString;

        setConversationId(idString);

        setMessages(
          (conversation.messages || []).map(
            (message) => ({
              id:
                message._id ||
                crypto.randomUUID(),

              role: message.role,

              content: message.content,

              provider:
                message.provider,

              model:
                message.model,

              latencyMs:
                message.latencyMs,

              createdAt:
                message.createdAt,
            })
          )
        );

        if (conversation.provider) {
          setProvider(
            conversation.provider
          );
        }
      } catch (error) {
        console.error(
          "Failed to load conversation:",
          error
        );
      } finally {
        setConversationLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Initial load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /*
  |--------------------------------------------------------------------------
  | Send message
  |--------------------------------------------------------------------------
  */

  const sendMessage = useCallback(
    async (content) => {
      const trimmedContent =
        content.trim();

      if (!trimmedContent || loading) {
        return;
      }

      const userMessage = {
        id: crypto.randomUUID(),

        role: "user",

        content: trimmedContent,

        createdAt:
          new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev,
        userMessage,
      ]);

      setLoading(true);

      /*
      ------------------------------------------------------------------------
      IMPORTANT
      ------------------------------------------------------------------------
      Always read the latest ID from the ref.
      */

      const activeConversationId =
        conversationIdRef.current;

      console.log(
        "SENDING MESSAGE:",
        trimmedContent
      );

      console.log(
        "ACTIVE CONVERSATION ID:",
        activeConversationId
      );

      try {
        const response =
          await sendMessageRequest({
            message: trimmedContent,

            provider,

            conversationId:
              activeConversationId,
          });

        const data = response.data;

        console.log(
          "BACKEND CONVERSATION ID:",
          data.conversationId
        );

        /*
        |--------------------------------------------------------------------------
        | Store returned conversation ID
        |--------------------------------------------------------------------------
        */

        if (data.conversationId) {
          const returnedId =
            data.conversationId.toString();

          conversationIdRef.current =
            returnedId;

          setConversationId(
            returnedId
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Add assistant message
        |--------------------------------------------------------------------------
        */

        const assistantMessage = {
          id: crypto.randomUUID(),

          role: "assistant",

          content: data.content,

          provider: data.provider,

          model: data.model,

          latencyMs: data.latencyMs,

          createdAt:
            new Date().toISOString(),
        };

        setMessages((prev) => [
          ...prev,
          assistantMessage,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Refresh sidebar
        |--------------------------------------------------------------------------
        */

        await loadConversations();
      } catch (error) {
        console.error(
          "Chat Error:",
          error
        );

        const errorMessage = {
          id: crypto.randomUUID(),

          role: "assistant",

          content:
            error.response?.data?.message ||
            error.message ||
            "Something went wrong.",

          createdAt:
            new Date().toISOString(),

          isError: true,
        };

        setMessages((prev) => [
          ...prev,
          errorMessage,
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      provider,
      loadConversations,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | New Chat
  |--------------------------------------------------------------------------
  */

  const clearChat = useCallback(() => {
    console.log("NEW CHAT");

    conversationIdRef.current = null;

    setConversationId(null);

    setMessages([]);

    setProvider("auto");
  }, []);

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

        clearChat,

        loadConversation,

        loadConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}