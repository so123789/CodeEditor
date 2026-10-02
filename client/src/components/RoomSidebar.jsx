import React from 'react';
import { Users, MessageSquare, FileCode } from 'lucide-react';
import PresenceList from './PresenceList.jsx';
import ChatPanel from './ChatPanel.jsx';
import SnippetPanel from './SnippetPanel.jsx';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'snippets', label: 'Snippets', icon: FileCode },
];

export default function RoomSidebar({
  panel,
  onPanelChange,
  users,
  selfId,
  chat,
  onSendChat,
  snippets,
  snippetsLoading,
  snippetsError,
  onLoadSnippet,
  onDeleteSnippet,
}) {
  return (
    <div className="room-sidebar">
      <div className="tabs" role="tablist" aria-label="Room panels">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={panel === t.id}
            className={panel === t.id ? 'active' : ''}
            onClick={() => onPanelChange(t.id)}
          >
            <t.icon size={15} />
            {t.label}
            {t.id === 'users' && <span className="tab-count">{users.length}</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-content" role="tabpanel">
        {panel === 'users' && (
          <div className="users-panel">
            <PresenceList users={users} selfId={selfId} />
          </div>
        )}
        {panel === 'chat' && <ChatPanel chat={chat} selfId={selfId} onSend={onSendChat} />}
        {panel === 'snippets' && (
          <SnippetPanel
            snippets={snippets}
            loading={snippetsLoading}
            error={snippetsError}
            onLoad={onLoadSnippet}
            onDelete={onDeleteSnippet}
          />
        )}
      </div>
    </div>
  );
}
