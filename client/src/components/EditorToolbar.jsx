import React from 'react';
import { Map, WrapText, Minus, Plus, Indent, Copy } from 'lucide-react';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'html', 'css', 'json', 'markdown', 'sql'];

export default function EditorToolbar({
  language,
  onLanguageChange,
  minimap,
  onToggleMinimap,
  wordWrap,
  onToggleWordWrap,
  fontSize,
  onFontSizeChange,
  onFormat,
  onCopy,
}) {
  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Editor settings">
      <select value={language} onChange={(e) => onLanguageChange(e.target.value)} aria-label="Language">
        {LANGUAGES.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>

      <div className="toolbar-group" role="group" aria-label="Font size">
        <button className="icon-btn" onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))} aria-label="Decrease font size">
          <Minus size={14} />
        </button>
        <span className="toolbar-value">{fontSize}px</span>
        <button className="icon-btn" onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))} aria-label="Increase font size">
          <Plus size={14} />
        </button>
      </div>

      <button
        className={`icon-btn ${minimap ? 'active' : ''}`}
        onClick={onToggleMinimap}
        aria-pressed={minimap}
        aria-label="Toggle minimap"
        title="Toggle minimap"
      >
        <Map size={16} />
      </button>

      <button
        className={`icon-btn ${wordWrap ? 'active' : ''}`}
        onClick={onToggleWordWrap}
        aria-pressed={wordWrap}
        aria-label="Toggle word wrap"
        title="Toggle word wrap"
      >
        <WrapText size={16} />
      </button>

      <button className="icon-btn" onClick={onFormat} aria-label="Format document" title="Format document">
        <Indent size={16} />
      </button>

      <button className="icon-btn" onClick={onCopy} aria-label="Copy code" title="Copy code">
        <Copy size={16} />
      </button>
    </div>
  );
}
