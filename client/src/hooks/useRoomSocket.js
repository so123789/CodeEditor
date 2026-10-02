import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../api.js';
import { useToast } from '../toast.jsx';

/**
 * Owns the Socket.io connection lifecycle for a room. Monaco-specific side effects
 * (applying remote edits, drawing/removing remote cursors, buffering initial content)
 * are delegated back to the caller via callbacks, since those need direct access to
 * the live editor instance that lives in the component using this hook.
 */
export function useRoomSocket({ roomId, name, onInit, onRemoteEdit, onRemoteReplace, onCursor, onCursorLeft, onJoinError }) {
  const socketRef = useRef(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [users, setUsers] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const [chat, setChat] = useState([]);
  const [language, setLanguage] = useState('javascript');

  const showToast = useToast();
  const prevUsers = useRef(new Map());
  const hasConnectedBefore = useRef(false);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const handleConnect = () => {
      setConnectionState('connected');
      socket.emit('join', { roomId, name });
      if (hasConnectedBefore.current) showToast('Reconnected — content resynced', 'success');
      hasConnectedBefore.current = true;
    };
    const handleDisconnect = () => setConnectionState('disconnected');
    const handleReconnectAttempt = () => setConnectionState('reconnecting');
    const handleReconnectFailed = () => showToast('Unable to reconnect to CodeCollab', 'error');

    const handleJoinError = ({ message }) => {
      onJoinError?.(message);
      showToast(message || 'Could not join room', 'error');
    };

    const handleInit = (data) => {
      setSelfId(data.selfId);
      setLanguage(data.language);
      setChat(data.chat);
      setUsers(data.users);
      prevUsers.current = new Map(data.users.map((u) => [u.id, u.name]));
      onInit?.(data.content);
    };

    const handleUsers = (list) => {
      const prev = prevUsers.current;
      const next = new Map(list.map((u) => [u.id, u.name]));
      for (const [id, uName] of next) if (!prev.has(id)) showToast(`${uName} joined the room`, 'info');
      for (const [id, uName] of prev) if (!next.has(id)) showToast(`${uName} left the room`, 'info');
      prevUsers.current = next;
      setUsers(list);
    };

    const handleLanguage = setLanguage;
    const handleReplace = ({ content, language: lang }) => {
      onRemoteReplace?.(content);
      if (lang) setLanguage(lang);
    };
    const handleEdit = ({ changes }) => onRemoteEdit?.(changes);
    const handleCursor = ({ id, position, selection }) => onCursor?.(id, position, selection);
    const handleCursorLeft = (id) => onCursorLeft?.(id);
    const handleChat = (msg) => setChat((c) => [...c, msg]);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_failed', handleReconnectFailed);
    socket.on('join-error', handleJoinError);
    socket.on('init', handleInit);
    socket.on('users', handleUsers);
    socket.on('language', handleLanguage);
    socket.on('replace', handleReplace);
    socket.on('edit', handleEdit);
    socket.on('cursor', handleCursor);
    socket.on('cursor-left', handleCursorLeft);
    socket.on('chat', handleChat);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_failed', handleReconnectFailed);
      socket.off('join-error', handleJoinError);
      socket.off('init', handleInit);
      socket.off('users', handleUsers);
      socket.off('language', handleLanguage);
      socket.off('replace', handleReplace);
      socket.off('edit', handleEdit);
      socket.off('cursor', handleCursor);
      socket.off('cursor-left', handleCursorLeft);
      socket.off('chat', handleChat);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, name]);

  const emitEdit = useCallback((changes) => socketRef.current?.emit('edit', { changes }), []);
  const emitSnapshot = useCallback((content) => socketRef.current?.emit('snapshot', { content }), []);
  const emitCursor = useCallback((position, selection) => socketRef.current?.emit('cursor', { position, selection }), []);
  const emitLanguage = useCallback((lang) => {
    setLanguage(lang);
    socketRef.current?.emit('language', lang);
  }, []);
  const emitReplace = useCallback((content, lang) => socketRef.current?.emit('replace', { content, language: lang }), []);
  const emitChat = useCallback((text) => socketRef.current?.emit('chat', text), []);

  return {
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
  };
}
