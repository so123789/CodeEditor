import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const CONFIG = {
  connected: { icon: Wifi, label: 'Connected', className: 'status-connected' },
  connecting: { icon: RefreshCw, label: 'Connecting…', className: 'status-connecting', spin: true },
  reconnecting: { icon: RefreshCw, label: 'Reconnecting…', className: 'status-connecting', spin: true },
  disconnected: { icon: WifiOff, label: 'Disconnected', className: 'status-disconnected' },
};

export default function ConnectionStatus({ state }) {
  const cfg = CONFIG[state] || CONFIG.disconnected;
  const Icon = cfg.icon;
  return (
    <span className={`connection-status ${cfg.className}`} title={cfg.label}>
      <Icon size={14} className={cfg.spin ? 'spin' : ''} aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}
