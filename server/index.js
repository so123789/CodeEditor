require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || '*').split(',').map((o) => o.trim());
const MONGO_URI = process.env.MONGO_URI;
const LANGUAGES = new Set(['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'html', 'css', 'json', 'markdown', 'sql']);

const corsOrigin = CLIENT_ORIGINS.includes('*') ? '*' : CLIENT_ORIGINS;

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

/* ---------- Snippet storage: MongoDB if configured & connected, else memory ---------- */
let mongoReady = false;
const memorySnippets = [];
let Snippet = null;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI).catch((e) => console.error('MongoDB connection failed:', e.message));
  mongoose.connection.on('connected', () => {
    mongoReady = true;
    console.log('MongoDB connected');
  });
  mongoose.connection.on('disconnected', () => {
    mongoReady = false;
    console.warn('MongoDB disconnected, falling back to in-memory snippet storage');
  });
  mongoose.connection.on('error', (e) => {
    mongoReady = false;
    console.error('MongoDB error:', e.message);
  });
  Snippet = mongoose.model(
    'Snippet',
    new mongoose.Schema(
      {
        title: { type: String, required: true, maxlength: 120 },
        language: { type: String, default: 'javascript', maxlength: 30 },
        content: { type: String, default: '', maxlength: 200000 },
      },
      { timestamps: true }
    )
  );
} else {
  console.log('No MONGO_URI set: using in-memory snippet storage (lost on restart).');
}

const usingMongo = () => Boolean(Snippet) && mongoReady;

const shape = (s) => ({
  id: String(s._id || s.id),
  title: s.title,
  language: s.language,
  content: s.content,
  createdAt: s.createdAt,
});

function asyncRoute(handler) {
  return (req, res, next) => handler(req, res, next).catch(next);
}

app.get(
  '/api/snippets',
  asyncRoute(async (_req, res) => {
    const list = usingMongo()
      ? await Snippet.find().sort({ createdAt: -1 }).limit(100)
      : [...memorySnippets].reverse().slice(0, 100);
    res.json(list.map(shape));
  })
);

app.post(
  '/api/snippets',
  asyncRoute(async (req, res) => {
    const { title, language, content } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (language !== undefined && typeof language !== 'string') {
      return res.status(400).json({ error: 'language must be a string' });
    }
    if (content !== undefined && typeof content !== 'string') {
      return res.status(400).json({ error: 'content must be a string' });
    }
    if (typeof content === 'string' && content.length > 200000) {
      return res.status(400).json({ error: 'content is too large' });
    }
    const data = {
      title: title.trim().slice(0, 120),
      language: (language || 'javascript').slice(0, 30),
      content: (content || '').slice(0, 200000),
    };
    if (usingMongo()) return res.status(201).json(shape(await Snippet.create(data)));
    const s = { id: crypto.randomUUID(), createdAt: new Date(), ...data };
    memorySnippets.push(s);
    res.status(201).json(shape(s));
  })
);

app.delete(
  '/api/snippets/:id',
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    if (usingMongo()) {
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid snippet id' });
      await Snippet.findByIdAndDelete(id);
    } else {
      const i = memorySnippets.findIndex((s) => s.id === id);
      if (i >= 0) memorySnippets.splice(i, 1);
    }
    res.json({ ok: true });
  })
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/rooms', (_req, res) => {
  const list = [...rooms.entries()]
    .filter(([, r]) => r.users.size > 0)
    .map(([id, r]) => ({ id, userCount: r.users.size, language: r.language, lastActive: r.lastActive }))
    .sort((a, b) => b.lastActive - a.lastActive);
  res.json(list);
});

/* ---------- Serve built client in production ---------- */
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// Centralized error handler — never leak internals to the client.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
});

/* ---------- Real-time collaboration ---------- */
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });

const DEFAULT_CODE = `// Welcome to CodeCollab!\n// Share this page's URL and code together in real time.\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('world'));\n`;
const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#c084fc', '#f472b6'];
const ROOM_ID_RE = /^[a-zA-Z0-9_-]{3,64}$/;

/** roomId -> { content, language, users: Map<socketId, user>, chat: [] , lastActive } */
const rooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) rooms.set(id, { content: DEFAULT_CODE, language: 'javascript', users: new Map(), chat: [], lastActive: Date.now() });
  const r = rooms.get(id);
  r.lastActive = Date.now();
  return r;
}

const userList = (room) => [...room.users.entries()].map(([id, u]) => ({ id, ...u }));

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function sanitizePosition(p) {
  if (!p || typeof p !== 'object') return null;
  if (!isFiniteNumber(p.lineNumber) || !isFiniteNumber(p.column)) return null;
  return { lineNumber: p.lineNumber, column: p.column };
}

function sanitizeSelection(s) {
  if (!s || typeof s !== 'object') return null;
  if (![s.startLineNumber, s.startColumn, s.endLineNumber, s.endColumn].every(isFiniteNumber)) return null;
  return {
    startLineNumber: s.startLineNumber,
    startColumn: s.startColumn,
    endLineNumber: s.endLineNumber,
    endColumn: s.endColumn,
  };
}

io.on('connection', (socket) => {
  let roomId = null;

  socket.on('join', ({ roomId: rid, name } = {}) => {
    if (typeof rid !== 'string' || !ROOM_ID_RE.test(rid)) {
      socket.emit('join-error', { message: 'Invalid room id.' });
      return;
    }
    roomId = rid;
    const room = getRoom(roomId);
    const color = COLORS[room.users.size % COLORS.length];
    room.users.set(socket.id, { name: String(name || 'Anonymous').slice(0, 24), color });
    socket.join(roomId);
    socket.emit('init', {
      selfId: socket.id,
      content: room.content,
      language: room.language,
      chat: room.chat,
      users: userList(room),
    });
    io.to(roomId).emit('users', userList(room));
  });

  // Incremental Monaco edits, relayed to everyone else
  socket.on('edit', ({ changes } = {}) => {
    if (!roomId || !Array.isArray(changes)) return;
    socket.to(roomId).emit('edit', { changes, from: socket.id });
  });

  // Full-text snapshot so late joiners get current state
  socket.on('snapshot', ({ content } = {}) => {
    if (!roomId || typeof content !== 'string') return;
    getRoom(roomId).content = content.slice(0, 500000);
  });

  socket.on('cursor', (payload = {}) => {
    if (!roomId) return;
    const position = sanitizePosition(payload.position);
    if (!position) return;
    const selection = sanitizeSelection(payload.selection);
    socket.to(roomId).emit('cursor', { id: socket.id, position, selection });
  });

  socket.on('language', (language) => {
    if (!roomId || typeof language !== 'string' || !LANGUAGES.has(language)) return;
    getRoom(roomId).language = language;
    socket.to(roomId).emit('language', language);
  });

  // Replace whole document for everyone (e.g. loading a snippet)
  socket.on('replace', ({ content, language } = {}) => {
    if (!roomId) return;
    const room = getRoom(roomId);
    room.content = String(content || '').slice(0, 500000);
    if (typeof language === 'string' && LANGUAGES.has(language)) room.language = language;
    io.to(roomId).emit('replace', { content: room.content, language: room.language });
  });

  socket.on('chat', (text) => {
    if (!roomId || typeof text !== 'string' || !text.trim()) return;
    const room = getRoom(roomId);
    const u = room.users.get(socket.id);
    if (!u) return;
    const msg = { id: crypto.randomUUID(), from: socket.id, name: u.name, color: u.color, text: text.slice(0, 500), at: Date.now() };
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(roomId).emit('chat', msg);
  });

  socket.on('disconnect', () => {
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    room.users.delete(socket.id);
    io.to(roomId).emit('users', userList(room));
    io.to(roomId).emit('cursor-left', socket.id);
  });
});

// Clean up empty rooms after an hour
setInterval(() => {
  for (const [id, r] of rooms) if (r.users.size === 0 && Date.now() - r.lastActive > 3600000) rooms.delete(id);
}, 600000).unref();

server.listen(PORT, () => console.log(`CodeCollab server on http://localhost:${PORT}`));
