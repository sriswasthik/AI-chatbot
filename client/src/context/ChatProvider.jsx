import {
  useState,
  useCallback,
  useEffect,
} from "react";

import { ChatContext } from "./ChatContext";
import { sendMessage as sendMessageRequest } from "../services/chat.service";

export default function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("auto");

  useEffect(() => {
    console.log("Messages State:", messages);
  }, [messages]);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || loading) return;

      const userMessage = {
        id: Date.now(),
        role: "user",
        content,
      };

      console.log("User Message:", userMessage);

      setMessages((prev) => [...prev, userMessage]);

      setLoading(true);

      try {
        const { data } = await sendMessageRequest({
          message: content,
          provider,
        });

        console.log("AI Response:", data);

        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.content,
          provider: data.provider,
          model: data.model,
          latencyMs: data.latencyMs,
        };

        console.log(
          "Assistant Message:",
          assistantMessage
        );

        setMessages((prev) => [
          ...prev,
          assistantMessage,
        ]);
      } catch (error) {
        console.error("Chat Error:", error);

        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            error.response?.data?.message ||
            error.message ||
            "Something went wrong.",
        };

        console.log(
          "Error Message:",
          assistantMessage
        );

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