import React, { useEffect, useState } from 'react';
import {
  Zap, MousePointer2, Languages, MessageSquare, Bookmark, Link2, Sun, Moon, Menu, X,
  ArrowRight, Users, Plus, ChevronDown, Check,
} from 'lucide-react';
import { api } from './api.js';
import { useTheme } from './theme.jsx';

function randomRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

const FEATURES = [
  { icon: Zap, title: 'Real-time sync', text: 'Every keystroke streams to the room as an incremental edit — not a full-document overwrite.', big: true },
  { icon: MousePointer2, title: 'Live cursors', text: 'See where teammates are typing and what they’ve selected, each in their own color.' },
  { icon: MessageSquare, title: 'Built-in chat', text: 'Talk through the code right next to it. No context switching.' },
  { icon: Languages, title: '12 languages', text: 'JavaScript, Python, Go, Rust, SQL and more with full Monaco highlighting.' },
  { icon: Bookmark, title: 'Snippet library', text: 'Save useful code and load it into any room in one click.' },
  { icon: Link2, title: 'Share by link', text: 'One URL is the whole invite. Nobody needs an account.' },
];

const STEPS = [
  { title: 'Create a room', text: 'One click gives you a fresh room with a unique, shareable ID.' },
  { title: 'Share the link', text: 'Send it to anyone. They join instantly — no sign-up, no install.' },
  { title: 'Code together', text: 'Edit, chat and review live with every cursor visible.' },
];

const FAQS = [
  { q: 'Do my collaborators need an account?', a: 'No. Anyone with the room link can join and edit immediately. You just pick a display name.' },
  { q: 'Is my code saved?', a: 'The room keeps its document while people are using it. To keep something permanently, save it as a snippet and load it into any room later.' },
  { q: 'How many people can join a room?', a: 'There’s no hard cap. Each person gets their own cursor color and name label so it stays readable.' },
  { q: 'Which languages are supported?', a: 'JavaScript, TypeScript, Python, Java, C++, Go, Rust, HTML, CSS, JSON, Markdown and SQL.' },
];

const LANGS = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'HTML', 'CSS', 'JSON', 'Markdown', 'SQL'];

function EditorMockup() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-window">
        <div className="mock-titlebar">
          <span className="mock-dots"><i /><i /><i /></span>
          <span className="mock-file">binarySearch.js</span>
          <span className="mock-avatars">
            <b style={{ background: '#f9a8d4' }}>PR</b>
            <b style={{ background: '#93c5fd' }}>AK</b>
            <b style={{ background: '#c1f48f' }}>YO</b>
          </span>
        </div>
        <pre className="mock-code">
          <code>
            <span className="ln">1</span><span className="kw">function</span> <span className="fn">binarySearch</span>(arr, target) {'{'}{'\n'}
            <span className="ln">2</span>  <span className="kw">let</span> lo = <span className="nu">0</span>, hi = arr.length - <span className="nu">1</span>;{'\n'}
            <span className="ln">3</span>  <span className="kw">while</span> (lo &lt;= hi) {'{'}<span className="cursor c-pink"><em>Priya</em></span>{'\n'}
            <span className="ln">4</span>    <span className="kw">const</span> mid = (lo + hi) &gt;&gt; <span className="nu">1</span>;{'\n'}
            <span className="ln">5</span>    <span className="kw">if</span> (<span className="sel">arr[mid] === target</span>) <span className="kw">return</span> mid;{'\n'}
            <span className="ln">6</span>    arr[mid] &lt; target ? lo = mid + <span className="nu">1</span> : hi = mid - <span className="nu">1</span>;<span className="cursor c-blue"><em>Alex</em></span>{'\n'}
            <span className="ln">7</span>  {'}'}{'\n'}
            <span className="ln">8</span>  <span className="kw">return</span> -<span className="nu">1</span>;{'\n'}
            <span className="ln">9</span>{'}'}
          </code>
        </pre>
        <div className="mock-status">
          <span><i className="live-dot" /> Connected</span>
          <span>3 online</span>
          <span>JavaScript</span>
        </div>
      </div>

      <div className="mock-chat">
        <div className="mock-msg">
          <b style={{ background: '#93c5fd' }}>AK</b>
          <p><strong>Alex</strong>Can we use a bit shift for mid?</p>
        </div>
        <div className="mock-msg own">
          <p>Done, see line 4.</p>
        </div>
      </div>

      <div className="mock-badge">
        <Check size={14} /> Synced in 40ms
      </div>
    </div>
  );
}

function Faq({ q, a }) {
  return (
    <details className="faq-item">
      <summary>
        {q}
        <ChevronDown size={18} className="faq-chevron" />
      </summary>
      <p>{a}</p>
    </details>
  );
}

export default function HomePage({ onEnterRoom }) {
  const { theme, toggleTheme } = useTheme();
  const [rooms, setRooms] = useState(null);
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadRooms = () => api('/api/rooms').then(setRooms).catch(() => setRooms((r) => r ?? []));
    loadRooms();
    const t = setInterval(loadRooms, 5000);
    return () => clearInterval(t);
  }, []);

  const createRoom = () => onEnterRoom(randomRoomId());

  const joinRoom = (e) => {
    e.preventDefault();
    const id = joinId.trim();
    if (!/^[a-zA-Z0-9_-]{3,64}$/.test(id)) {
      setError('Room IDs are 3–64 letters, numbers, dashes or underscores.');
      return;
    }
    onEnterRoom(id);
  };

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    ['features', 'Features'],
    ['how-it-works', 'How it works'],
    ['rooms', 'Live rooms'],
    ['faq', 'FAQ'],
  ];

  return (
    <div className="landing">
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand" href="/" aria-label="CodeCollab home">
            <span className="brand-mark">&lt;/&gt;</span> CodeCollab
          </a>

          <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="Main">
            {navLinks.map(([id, label]) => (
              <button key={id} className="nav-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn btn-dark header-cta" onClick={createRoom}>New room</button>
            <button
              className="icon-btn menu-toggle"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="site-main">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><i className="live-dot" /> Real-time collaborative editor</span>
              <h1>
                Pair programming is as quick as <span className="hl">sharing a link.</span>
              </h1>
              <p className="lead">
                Open a room, send the URL, and write code together with live cursors, chat and saved
                snippets. No accounts. No installs.
              </p>

              <div className="hero-actions">
                <button className="btn btn-accent btn-lg" onClick={createRoom}>
                  <Plus size={18} /> Create a room
                </button>
                <form onSubmit={joinRoom} className="join-form">
                  <input
                    value={joinId}
                    onChange={(e) => { setJoinId(e.target.value); setError(''); }}
                    placeholder="Have a room ID?"
                    aria-label="Room ID to join"
                    aria-invalid={Boolean(error)}
                  />
                  <button className="btn btn-ghost" type="submit" aria-label="Join room">
                    Join <ArrowRight size={16} />
                  </button>
                </form>
              </div>
              {error && <p className="error" role="alert">{error}</p>}

              <ul className="hero-points">
                <li><Check size={16} /> Free to use</li>
                <li><Check size={16} /> No sign-up</li>
                <li><Check size={16} /> 12 languages</li>
              </ul>
            </div>

            <EditorMockup />
          </div>
        </section>

        <div className="lang-strip" aria-label="Supported languages">
          <div className="lang-track">
            {[...LANGS, ...LANGS].map((l, i) => (
              <span key={i} aria-hidden={i >= LANGS.length}>{l}</span>
            ))}
          </div>
        </div>

        <section id="features" className="section">
          <div className="container">
            <div className="section-head">
              <span className="kicker">Features</span>
              <h2>Everything you need to pair program</h2>
              <p className="muted">A full Monaco editor with the collaboration pieces built in, not bolted on.</p>
            </div>
            <div className="bento">
              {FEATURES.map((f) => (
                <article key={f.title} className={`bento-card ${f.big ? 'bento-big' : ''}`}>
                  <span className="bento-icon"><f.icon size={20} /></span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  {f.big && (
                    <div className="sync-visual" aria-hidden="true">
                      <div className="sync-row"><b style={{ background: '#93c5fd' }}>AK</b><span className="sync-bar" /></div>
                      <div className="sync-row"><b style={{ background: '#f9a8d4' }}>PR</b><span className="sync-bar delay" /></div>
                      <div className="sync-row"><b style={{ background: '#c1f48f' }}>YO</b><span className="sync-bar delay2" /></div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section section-dark">
          <div className="container">
            <div className="section-head">
              <span className="kicker">How it works</span>
              <h2>From zero to coding together in three steps</h2>
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="step">
                  <span className="step-n">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="rooms" className="section">
          <div className="container narrow">
            <div className="section-head">
              <span className="kicker">Live now</span>
              <h2>Jump into an active room</h2>
            </div>

            {rooms === null ? (
              <div className="room-list">
                {[0, 1, 2].map((i) => <div key={i} className="room-item skeleton-row" />)}
              </div>
            ) : rooms.length === 0 ? (
              <div className="rooms-empty">
                <Users size={28} />
                <p>No active rooms right now.</p>
                <button className="btn btn-accent" onClick={createRoom}><Plus size={16} /> Start the first one</button>
              </div>
            ) : (
              <div className="room-list">
                {rooms.map((r) => (
                  <button key={r.id} className="room-item" onClick={() => onEnterRoom(r.id)}>
                    <span className="room-id">{r.id}</span>
                    <span className="room-lang">{r.language}</span>
                    <span className="room-count"><i className="live-dot" /> {r.userCount} online</span>
                    <ArrowRight size={16} className="room-arrow" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="faq" className="section">
          <div className="container faq-grid">
            <div className="section-head left">
              <span className="kicker">FAQ</span>
              <h2>More questions?</h2>
              <p className="muted">The short answers to what people usually ask first.</p>
            </div>
            <div className="faq-list">
              {FAQS.map((f) => <Faq key={f.q} {...f} />)}
            </div>
          </div>
        </section>

        <section className="section cta-section">
          <div className="container">
            <div className="cta-card">
              <h2>Start coding together in seconds.</h2>
              <p>Create a room, share the link, done.</p>
              <button className="btn btn-dark btn-lg" onClick={createRoom}>
                Create a room <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <span className="brand"><span className="brand-mark">&lt;/&gt;</span> CodeCollab</span>
            <p>A lightweight real-time code editor for quick pair-programming sessions, interviews and teaching.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <button className="footer-link" onClick={() => scrollTo('features')}>Features</button>
            <button className="footer-link" onClick={() => scrollTo('how-it-works')}>How it works</button>
            <button className="footer-link" onClick={() => scrollTo('rooms')}>Live rooms</button>
          </div>
          <div className="footer-col">
            <h4>Get started</h4>
            <button className="footer-link" onClick={createRoom}>Create a room</button>
            <button className="footer-link" onClick={() => scrollTo('faq')}>FAQ</button>
          </div>
          <div className="footer-col">
            <h4>Built with</h4>
            <span className="footer-text">React · Monaco</span>
            <span className="footer-text">Socket.IO · MongoDB</span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} CodeCollab</span>
          <span>Made for developers who like to pair.</span>
        </div>
      </footer>
    </div>
  );
}
