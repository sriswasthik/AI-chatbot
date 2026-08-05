import { useChat } from "../hooks/useChat";

import EmptyState from "../components/chat/EmptyState";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";

export default function Chat() {
  const { messages } = useChat();

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 ? (
        <MessageList messages={messages} />
      ) : (
        <EmptyState />
      )}

      <ChatInput />
    </div>
  );
}