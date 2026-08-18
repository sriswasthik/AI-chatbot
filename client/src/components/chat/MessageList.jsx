import { useEffect, useLayoutEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({
  messages,
  loading = false,
  onRetry,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  /*
  | Only follow the conversation when the user is already at the bottom.
  | Scrolling unconditionally yanked the view away from anyone reading
  | back through history while a reply arrived.
  */

  const pinnedToBottom = useRef(true);

  /*
  | Identifies which conversation is on screen: the first message changes
  | only when a different conversation is opened.
  */

  const firstMessageId = messages[0]?.id;

  function handleScroll() {
    const container = containerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    pinnedToBottom.current = distanceFromBottom < 120;
  }

  /*
  | Jump without animation when a different conversation is opened, so it
  | does not scroll through the whole transcript on switch.
  */

  useLayoutEffect(() => {
    pinnedToBottom.current = true;

    bottomRef.current?.scrollIntoView();
  }, [firstMessageId]);

  useEffect(() => {
    if (!pinnedToBottom.current) return;

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRetry={
              message.isError
                ? () => onRetry?.(message.id)
                : undefined
            }
          />
        ))}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
