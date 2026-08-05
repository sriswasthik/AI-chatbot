import { useState, useCallback } from "react";

import { ChatContext } from "./ChatContext";
import { sendMessage as sendMessageRequest } from "../services/chat.service";

export default function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [provider, setProvider] = useState("auto");

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || loading) return;

      const userMessage = {
        id: Date.now(),
        role: "user",
        content,
      };

      setMessages((prev) => [...prev, userMessage]);

      setLoading(true);

      try {
        const response = await sendMessageRequest({
          message: content,
          provider,
        });

        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: response.data.content,
          provider: response.data.provider,
          model: response.data.model,
          latencyMs: response.data.latencyMs,
        };

        setMessages((prev) => [
          ...prev,
          assistantMessage,
        ]);
      } catch (error) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            error.response?.data?.message ||
            "Something went wrong.",
        };

        setMessages((prev) => [
          ...prev,
          assistantMessage,
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, provider]
  );

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        provider,
        setProvider,
        sendMessage,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}   