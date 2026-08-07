import { useCallback, useState } from "react";

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
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await sendMessageRequest({
          message: content,
          provider,
        });

        // chat.service returns the API response body:
        // { success: true, data: { content, provider, model, latencyMs } }
        const aiData = response.data;

        if (!aiData?.content) {
          throw new Error("AI response did not contain content.");
        }

        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: aiData.content,
          provider: aiData.provider,
          model: aiData.model,
          latencyMs: aiData.latencyMs,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [
          ...prev,
          assistantMessage,
        ]);
      } catch (error) {
        console.error("Chat Error:", error);

        const errorMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error.response?.data?.message ||
            error.message ||
            "Something went wrong.",
          createdAt: new Date().toISOString(),
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
    [loading, provider]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

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