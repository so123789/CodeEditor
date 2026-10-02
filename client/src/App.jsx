import React, { useCallback, useEffect, useState } from 'react';
import HomePage from './HomePage.jsx';
import Editor from './Editor.jsx';
import { ThemeProvider } from './theme.jsx';
import { ToastProvider } from './toast.jsx';

function getRoomFromUrl() {
  return new URLSearchParams(window.location.search).get('room');
}

export default function App() {
  const [roomId, setRoomId] = useState(getRoomFromUrl);

  useEffect(() => {
    const onPopState = () => setRoomId(getRoomFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const enterRoom = useCallback((id) => {
    const params = new URLSearchParams(window.location.search);
    params.set('room', id);
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    setRoomId(id);
  }, []);

  const leaveRoom = useCallback(() => {
    window.history.pushState({}, '', window.location.pathname);
    setRoomId(null);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        {roomId ? <Editor roomId={roomId} onLeave={leaveRoom} /> : <HomePage onEnterRoom={enterRoom} />}
      </ToastProvider>
    </ThemeProvider>
  );
}
