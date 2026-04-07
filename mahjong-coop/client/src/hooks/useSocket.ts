import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const PLAYER_ID_KEY = 'mahjong_playerId';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameEvent, setGameEvent] = useState<{
    type: string;
    playerId: string;
    tiles?: [string, string];
  } | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(
    sessionStorage.getItem(PLAYER_ID_KEY)
  );
  const [isConnected, setIsConnected] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Fix #3: attempt rejoin on reconnect if we have a stored playerId
      const storedId = sessionStorage.getItem(PLAYER_ID_KEY);
      if (storedId) {
        socket.emit('player:rejoin', storedId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('game:state', (state: GameState) => {
      setGameState(state);
    });

    socket.on('game:event', (event: { type: string; playerId: string; tiles?: [string, string] }) => {
      setGameEvent(event);
    });

    // Server acknowledges player join/rejoin — store the playerId
    socket.on('player:joined', ({ playerId: pid }: { playerId: string }) => {
      setPlayerId(pid);
      sessionStorage.setItem(PLAYER_ID_KEY, pid);
      setPlayerError(null);
    });

    socket.on('player:error', (msg: string) => {
      setPlayerError(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function joinGame(name: string) {
    setPlayerError(null);
    socketRef.current?.emit('player:join', name);
  }

  function selectTile(tileId: string) {
    socketRef.current?.emit('tile:select', tileId);
  }

  function restartGame() {
    sessionStorage.removeItem(PLAYER_ID_KEY);
    setPlayerId(null);
    socketRef.current?.emit('game:restart');
  }

  return {
    gameState,
    gameEvent,
    playerId,
    isConnected,
    playerError,
    joinGame,
    selectTile,
    restartGame,
  };
}
