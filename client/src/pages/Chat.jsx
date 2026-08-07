import { useChat } from "../hooks/useChat";

import EmptyState from "../components/chat/EmptyState";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import ProviderSelector from "../components/chat/ProviderSelector";

export default function Chat() {
  const { messages } = useChat();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            AI Provider
          </p>
        </div>

        <ProviderSelector />
      </div>

      <div className="min-h-0 flex-1">
        {messages.length > 0 ? (
          <MessageList messages={messages} />
        ) : (
          <EmptyState />
        )}
      </div>

      <ChatInput />
    </div>
  );
}