import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({
  messages,
  loading = false,
}) {
  const bottomRef = useRef(null);

  /*
  | Scroll on a new message or when the typing indicator appears, rather
  | than on every re-render that hands back a new array identity.
  */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length, loading]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
