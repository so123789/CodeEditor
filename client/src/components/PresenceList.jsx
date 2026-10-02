import React from 'react';

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name, color, size = 26 }) {
  return (
    <span
      className="avatar"
      style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export default function PresenceList({ users, selfId, compact = false }) {
  return (
    <div className={`presence-list ${compact ? 'compact' : ''}`}>
      {users.map((u) => (
        <span key={u.id} className="presence-item" title={u.name + (u.id === selfId ? ' (you)' : '')}>
          <Avatar name={u.name} color={u.color} size={compact ? 22 : 26} />
          {!compact && (
            <span className="presence-name">
              {u.name}
              {u.id === selfId && <span className="muted"> (you)</span>}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
