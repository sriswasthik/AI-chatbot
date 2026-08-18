import { Loader2 } from "lucide-react";

import { useChat } from "../hooks/useChat";

import EmptyState from "../components/chat/EmptyState";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import ProviderSelector from "../components/chat/ProviderSelector";

export default function Chat() {
  const {
    messages,
    loading,
    conversationLoading,
    retryMessage,
    sendMessage,
  } = useChat();

  function renderBody() {
    if (conversationLoading) {
      return (
        <div className="flex h-full items-center justify-center text-slate-500">
          <Loader2 size={22} className="animate-spin" />
        </div>
      );
    }

    if (messages.length === 0) {
      return <EmptyState onPick={sendMessage} />;
    }

    return (
      <MessageList
        messages={messages}
        loading={loading}
        onRetry={retryMessage}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          AI Provider
        </p>

        <ProviderSelector />
      </div>

      <div className="min-h-0 flex-1">{renderBody()}</div>

      <ChatInput />
    </div>
  );
}
