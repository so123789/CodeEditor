import React from 'react';
import ConnectionStatus from './ConnectionStatus.jsx';

export default function StatusBar({ language, connectionState, syncing, cursorPos, userCount }) {
  return (
    <div className="status-bar">
      <span className="status-item">{language}</span>
      <span className="status-item">{syncing ? 'Syncing…' : 'Synced'}</span>
      {cursorPos && (
        <span className="status-item">
          Ln {cursorPos.lineNumber}, Col {cursorPos.column}
        </span>
      )}
      <span className="status-spacer" />
      <span className="status-item">{userCount} online</span>
      <ConnectionStatus state={connectionState} />
    </div>
  );
}
