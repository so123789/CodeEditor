import React, { useCallback, useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { api } from './api.js';
import { useTheme } from './theme.jsx';
import { useToast } from './toast.jsx';
import { useRoomSocket } from './hooks/useRoomSocket.js';
import { usePersistedState } from './hooks/usePersistedState.js';
import Header from './components/Header.jsx';
import StatusBar from './components/StatusBar.jsx';
import EditorToolbar from './components/EditorToolbar.jsx';
import RoomSidebar from './components/RoomSidebar.jsx';
import Drawer from './components/Drawer.jsx';
import ShareDialog from './components/ShareDialog.jsx';
import SaveSnippetDialog from './components/SaveSnippetDialog.jsx';

function getName() {
  let n = localStorage.getItem('cc-name');
  if (!n) {
    n = `Guest${Math.floor(Math.random() * 900 + 100)}`;
    localStorage.setItem('cc-name', n);
  }
  return n;
}

export default function Editor({ roomId, onLeave }) {
  const { theme } = useTheme();
  const showToast = useToast();

  const [name, setName] = useState(getName);
  const [panel, setPanel] = usePersistedState('cc-panel', 'chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const [minimap, setMinimap] = usePersistedState('cc-minimap', false);
  const [wordWrap, setWordWrap] = usePersistedState('cc-wordwrap', false);
  const [fontSize, setFontSize] = usePersistedState('cc-fontsize', 14);

  const [snippets, setSnippets] = useState([]);
  const [snippetsLoading, setSnippetsLoading] = useState(false);
  const [snippetsError, setSnippetsError] = useState('');

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const applyingRemote = useRef(false);
  const pendingInit = useRef(null);
  const snapshotTimer = useRef(null);
  const cursors = useRef(new Map()); // id -> { collection, styleEl }

  const setEditorValue = useCallback((content) => {
    const ed = editorRef.current;
    if (!ed) {
      pendingInit.current = content;
      return;
    }
    applyingRemote.current = true;
    ed.getModel().setValue(content);
    applyingRemote.current = false;
  }, []);

  const removeCursor = useCallback((id) => {
    const c = cursors.current.get(id);
    if (!c) return;
    c.collection.clear();
    c.styleEl.remove();
    cursors.current.delete(id);
  }, []);

  const drawCursor = useCallback((id, position, selection, user) => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco || !position || !user) return;
    let c = cursors.current.get(id);
    if (!c) {
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .rc-${id} { border-left: 2px solid ${user.color}; margin-left: -1px; }
        .rs-${id} { background: ${user.color}33; }
        .rl-${id}::after { content: '${user.name.replace(/[^\w ]/g, '')}'; position: absolute; top: -1.4em; left: -2px;
          background: ${user.color}; color: #111; font-size: 10px; padding: 0 4px; border-radius: 3px 3px 3px 0; white-space: nowrap; z-index: 10; }`;
      document.head.appendChild(styleEl);
      c = { collection: ed.createDecorationsCollection([]), styleEl };
      cursors.current.set(id, c);
    }
    const decorations = [
      {
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        options: { className: `rc-${id}`, beforeContentClassName: `rl-${id}`, stickiness: 1 },
      },
    ];
    if (selection && (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn)) {
      decorations.push({
        range: new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn),
        options: { className: `rs-${id}` },
      });
    }
    c.collection.set(decorations);
  }, []);

  const usersRef = useRef([]);

  const {
    connectionState,
    users,
    selfId,
    chat,
    language,
    emitEdit,
    emitSnapshot,
    emitCursor,
    emitLanguage,
    emitReplace,
    emitChat,
  } = useRoomSocket({
    roomId,
    name,
    onInit: setEditorValue,
    onRemoteEdit: (changes) => {
      const ed = editorRef.current;
      if (!ed) return;
      applyingRemote.current = true;
      ed.getModel().applyEdits(changes.map((c) => ({ range: c.range, text: c.text, forceMoveMarkers: true })));
      applyingRemote.current = false;
    },
    onRemoteReplace: setEditorValue,
    onCursor: (id, position, selection) => {
      const user = usersRef.current.find((u) => u.id === id);
      drawCursor(id, position, selection, user);
    },
    onCursorLeft: removeCursor,
    onJoinError: () => onLeave(),
  });

  usersRef.current = users;

  const monacoTheme = theme === 'dark' ? 'cc-dark' : 'cc-light';

  const beforeMount = (monaco) => {
    monaco.editor.defineTheme('cc-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f140b',
        'editor.lineHighlightBackground': '#1d2617',
        'editorLineNumber.foreground': '#4a5640',
        'editorLineNumber.activeForeground': '#c1f48f',
        'editor.selectionBackground': '#3a4630',
        'editorCursor.foreground': '#c1f48f',
      },
    });
    monaco.editor.defineTheme('cc-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#fefffc',
        'editor.lineHighlightBackground': '#f2f5ee',
        'editorLineNumber.foreground': '#a3a99b',
        'editorLineNumber.activeForeground': '#1e2c0f',
        'editor.selectionBackground': '#dcefc4',
        'editorCursor.foreground': '#1e2c0f',
      },
    });
  };

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (pendingInit.current !== null) {
      setEditorValue(pendingInit.current);
      pendingInit.current = null;
    }

    editor.onDidChangeModelContent((e) => {
      if (applyingRemote.current) return;
      emitEdit(e.changes.map((c) => ({ range: c.range, text: c.text })));
      setSyncing(true);
      clearTimeout(snapshotTimer.current);
      snapshotTimer.current = setTimeout(() => {
        emitSnapshot(editor.getValue());
        setSyncing(false);
      }, 300);
    });

    const sendCursor = () => {
      emitCursor(editor.getPosition(), editor.getSelection());
      setCursorPos(editor.getPosition());
    };
    editor.onDidChangeCursorPosition(sendCursor);
    editor.onDidChangeCursorSelection(sendCursor);
  };

  const loadSnippets = useCallback(() => {
    setSnippetsLoading(true);
    setSnippetsError('');
    api('/api/snippets')
      .then(setSnippets)
      .catch(() => setSnippetsError('Could not load snippets.'))
      .finally(() => setSnippetsLoading(false));
  }, []);

  useEffect(() => {
    if (panel === 'snippets') loadSnippets();
  }, [panel, loadSnippets]);

  const rename = (newName) => {
    setName(newName);
    localStorage.setItem('cc-name', newName);
    showToast('Name updated', 'success');
  };

  const saveSnippet = async (title) => {
    try {
      await api('/api/snippets', {
        method: 'POST',
        body: JSON.stringify({ title, language, content: editorRef.current.getValue() }),
      });
      showToast('Snippet saved', 'success');
      if (panel === 'snippets') loadSnippets();
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
      throw err;
    }
  };

  const loadSnippet = (s) => {
    emitReplace(s.content, s.language);
    showToast(`Loaded "${s.title}" into the room`, 'success');
  };

  const deleteSnippet = async (id) => {
    try {
      await api(`/api/snippets/${id}`, { method: 'DELETE' });
      setSnippets((list) => list.filter((s) => s.id !== id));
      showToast('Snippet deleted', 'success');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(editorRef.current?.getValue() || '');
    showToast('Code copied to clipboard', 'success');
  };

  const formatDoc = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  };

  const sidebarProps = {
    panel,
    onPanelChange: setPanel,
    users,
    selfId,
    chat,
    onSendChat: emitChat,
    snippets,
    snippetsLoading,
    snippetsError,
    onLoadSnippet: loadSnippet,
    onDeleteSnippet: deleteSnippet,
  };

  return (
    <div className="app">
      <Header
        roomId={roomId}
        connectionState={connectionState}
        users={users}
        selfId={selfId}
        name={name}
        onRename={rename}
        onLeave={onLeave}
        onShare={() => setShareOpen(true)}
        onSaveSnippet={() => setSaveOpen(true)}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <main>
        <div className="editor-column">
          <EditorToolbar
            language={language}
            onLanguageChange={emitLanguage}
            minimap={minimap}
            onToggleMinimap={() => setMinimap((v) => !v)}
            wordWrap={wordWrap}
            onToggleWordWrap={() => setWordWrap((v) => !v)}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            onFormat={formatDoc}
            onCopy={copyCode}
          />
          <div className="editor">
            {connectionState === 'connecting' && (
              <div className="editor-overlay">
                <div className="skeleton-block" />
                <p>Connecting to room…</p>
              </div>
            )}
            <MonacoEditor
              height="100%"
              theme={monacoTheme}
              language={language}
              defaultValue=""
              beforeMount={beforeMount}
              onMount={onMount}
              options={{
                fontSize,
                minimap: { enabled: minimap },
                wordWrap: wordWrap ? 'on' : 'off',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
              }}
            />
          </div>
          <StatusBar
            language={language}
            connectionState={connectionState}
            syncing={syncing}
            cursorPos={cursorPos}
            userCount={users.length}
          />
        </div>

        <aside className="sidebar-desktop">
          <RoomSidebar {...sidebarProps} />
        </aside>
      </main>

      <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Room">
        <RoomSidebar {...sidebarProps} />
      </Drawer>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} roomId={roomId} />
      <SaveSnippetDialog open={saveOpen} onClose={() => setSaveOpen(false)} onSave={saveSnippet} language={language} />
    </div>
  );
}
