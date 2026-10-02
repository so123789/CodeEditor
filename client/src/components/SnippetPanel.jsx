import React, { memo, useMemo, useState } from 'react';
import { Search, Download, Trash2, FileCode, Loader2 } from 'lucide-react';

const CONFIRM_COPY = {
  load: { text: 'Replace the shared document for everyone?', action: 'Load', className: 'primary' },
  delete: { text: 'Delete this snippet permanently?', action: 'Delete', className: 'danger-btn' },
};

const SnippetRow = memo(function SnippetRow({ snippet, onLoad, onDelete }) {
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const runConfirmed = async () => {
    setBusy(true);
    try {
      if (confirm === 'load') await onLoad(snippet);
      else await onDelete(snippet.id);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const copy = confirm && CONFIRM_COPY[confirm];

  return (
    <div className={`snippet ${confirm ? `confirming confirming-${confirm}` : ''}`}>
      <div className="snippet-main">
        <div className="snippet-info">
          <b>{snippet.title}</b>
          <small>
            {snippet.language} · {new Date(snippet.createdAt).toLocaleDateString()}
          </small>
        </div>
        {!confirm && (
          <div className="snippet-actions">
            <button className="snippet-load" onClick={() => setConfirm('load')} aria-label={`Load snippet ${snippet.title}`} title="Load into room">
              <Download size={14} /> Load
            </button>
            <button className="icon-btn" onClick={() => setConfirm('delete')} aria-label={`Delete snippet ${snippet.title}`} title="Delete">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {copy && (
        <div className="snippet-confirm" role="alertdialog" aria-label={copy.text}>
          <span>{copy.text}</span>
          <div className="snippet-confirm-actions">
            <button onClick={() => setConfirm(null)} disabled={busy}>Cancel</button>
            <button className={copy.className} onClick={runConfirmed} disabled={busy} autoFocus>
              {busy ? <Loader2 size={14} className="spin" /> : copy.action}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default function SnippetPanel({ snippets, loading, error, onLoad, onDelete }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter((s) => s.title.toLowerCase().includes(q) || s.language.toLowerCase().includes(q));
  }, [snippets, query]);

  return (
    <div className="snippet-panel">
      <div className="snippet-search">
        <Search size={14} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search snippets…" aria-label="Search snippets" />
      </div>

      <div className="snippets">
        {loading && (
          <div className="empty-state">
            <Loader2 size={24} className="spin" />
            <p>Loading snippets…</p>
          </div>
        )}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <FileCode size={28} />
            <p>{snippets.length === 0 ? 'No saved snippets yet.' : 'No snippets match your search.'}</p>
          </div>
        )}
        {!loading && !error && filtered.map((s) => <SnippetRow key={s.id} snippet={s} onLoad={onLoad} onDelete={onDelete} />)}
      </div>
    </div>
  );
}
