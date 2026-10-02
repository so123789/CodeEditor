import React from 'react';
import { Copy, Share2 } from 'lucide-react';
import Modal from './Modal.jsx';
import { useToast } from '../toast.jsx';

export default function ShareDialog({ open, onClose, roomId }) {
  const showToast = useToast();
  const link = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard', 'success');
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'CodeCollab room', url: link });
    } catch {
      /* user cancelled share sheet — no-op */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share this room" className="share-modal">
      <p className="muted">Anyone with this link can join this room.</p>
      <div className="share-link-row">
        <span className="room-id-badge">{roomId}</span>
        <code className="share-link">{link}</code>
      </div>
      <div className="share-actions">
        <button className="primary" onClick={copyLink}>
          <Copy size={16} /> Copy link
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button onClick={nativeShare}>
            <Share2 size={16} /> Share…
          </button>
        )}
      </div>
    </Modal>
  );
}
