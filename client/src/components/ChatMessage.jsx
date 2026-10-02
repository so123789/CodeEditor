import React, { memo } from 'react';
import { Avatar } from './PresenceList.jsx';

function formatTime(at) {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatMessage({ message, own, showHeader }) {
  return (
    <div className={`chat-msg ${own ? 'own' : ''}`}>
      {showHeader && !own && <Avatar name={message.name} color={message.color} size={22} />}
      <div className="chat-msg-body">
        {showHeader && (
          <div className="chat-msg-meta">
            {!own && <b style={{ color: message.color }}>{message.name}</b>}
            <time title={new Date(message.at).toLocaleString()}>{formatTime(message.at)}</time>
          </div>
        )}
        <div className="chat-bubble">{message.text}</div>
      </div>
    </div>
  );
}

export default memo(ChatMessage);
