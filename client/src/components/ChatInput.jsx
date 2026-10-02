import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <form onSubmit={submit} className="chat-form">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Message the room…"
        title="Enter to send · Shift+Enter for a new line"
        maxLength={500}
        rows={1}
        aria-label="Chat message"
      />
      <button className="primary icon-btn" type="submit" aria-label="Send message" disabled={!text.trim()}>
        <Send size={16} />
      </button>
    </form>
  );
}
