import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, ArrowDown } from 'lucide-react';
import ChatMessage from './ChatMessage.jsx';
import ChatInput from './ChatInput.jsx';

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export default function ChatPanel({ chat, selfId, onSend }) {
  const listRef = useRef(null);
  const [nearBottom, setNearBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevLen = useRef(chat.length);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setNewCount(0);
  };

  useEffect(() => {
    const grew = chat.length > prevLen.current;
    prevLen.current = chat.length;
    if (!grew) return;
    if (nearBottom) {
      scrollToBottom();
    } else {
      setNewCount((c) => c + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.length]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 80;
    setNearBottom(atBottom);
    if (atBottom) setNewCount(0);
  };

  return (
    <div className="chat-panel">
      <div className="messages" ref={listRef} onScroll={onScroll}>
        {chat.length === 0 && (
          <div className="empty-state">
            <MessageSquare size={28} />
            <p>Start the conversation with your collaborators.</p>
          </div>
        )}
        {chat.map((m, i) => {
          const prev = chat[i - 1];
          const own = m.from === selfId;
          const showHeader = !prev || prev.from !== m.from || m.at - prev.at > GROUP_WINDOW_MS;
          return <ChatMessage key={m.id} message={m} own={own} showHeader={showHeader} />;
        })}
      </div>

      {newCount > 0 && (
        <button className="new-messages-pill" onClick={scrollToBottom}>
          <ArrowDown size={14} /> {newCount} new message{newCount > 1 ? 's' : ''}
        </button>
      )}

      <ChatInput onSend={onSend} />
    </div>
  );
}
