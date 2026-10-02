import React, { useState } from 'react';
import Modal from './Modal.jsx';

export default function SaveSnippetDialog({ open, onClose, onSave, language }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      setTitle('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Save snippet">
      <form onSubmit={submit} className="save-snippet-form">
        <label htmlFor="snippet-title">Title</label>
        <input
          id="snippet-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Binary search helper"
          maxLength={120}
        />
        <p className="muted">Saved as {language}. You can load it into any room later.</p>
        <div className="share-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={!title.trim() || saving}>
            {saving ? 'Saving…' : 'Save snippet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
