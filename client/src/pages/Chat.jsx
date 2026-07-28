import { sampleMessages } from "../data/sampleMessages";

import EmptyState from "../components/chat/EmptyState";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";

export default function Chat() {
  const hasMessages = sampleMessages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {hasMessages ? (
        <MessageList messages={sampleMessages} />
      ) : (
        <EmptyState />
      )}

      <ChatInput />
    </div>
  );
}