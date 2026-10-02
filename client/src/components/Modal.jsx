import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, className = '' }) {
  const panelRef = useRef(null);
  const triggerRef = useRef(document.activeElement);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    panelRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal-panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
