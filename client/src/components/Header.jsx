import React, { useState } from 'react';
import { ArrowLeft, Share2, Sun, Moon, Save, PanelRightOpen, Pencil } from 'lucide-react';
import ConnectionStatus from './ConnectionStatus.jsx';
import PresenceList from './PresenceList.jsx';
import { useTheme } from '../theme.jsx';

export default function Header({
  roomId,
  connectionState,
  users,
  selfId,
  name,
  onRename,
  onLeave,
  onShare,
  onSaveSnippet,
  onToggleSidebar,
}) {
  const { theme, toggleTheme } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);

  const submitName = (e) => {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (trimmed) onRename(trimmed);
    setEditingName(false);
  };

  return (
    <header className="app-header">
      <div className="brand">
        <button className="icon-btn" onClick={onLeave} aria-label="Back to home" title="Back to home">
          <ArrowLeft size={18} />
        </button>
        <span className="logo">&lt;/&gt;</span>
        <span className="brand-name">CodeCollab</span>
        <span className="room-badge" title={`Room ${roomId}`}>
          {roomId}
        </span>
      </div>

      <div className="header-center">
        <ConnectionStatus state={connectionState} />
        <PresenceList users={users} selfId={selfId} compact />
      </div>

      <div className="controls">
        {editingName ? (
          <form onSubmit={submitName} className="rename-form">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={submitName}
              maxLength={24}
              aria-label="Your display name"
            />
          </form>
        ) : (
          <button className="link name-badge" onClick={() => setEditingName(true)} aria-label="Edit your display name" title="Click to rename">
            <Pencil size={13} /> {name}
          </button>
        )}

        <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button className="icon-btn" onClick={onSaveSnippet} aria-label="Save snippet" title="Save snippet">
          <Save size={17} />
        </button>

        <button className="primary" onClick={onShare}>
          <Share2 size={15} /> Share
        </button>

        <button className="icon-btn sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle room panel" title="Toggle room panel">
          <PanelRightOpen size={18} />
        </button>
      </div>
    </header>
  );
}
