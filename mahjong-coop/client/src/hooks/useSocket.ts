import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameEvent, setGameEvent] = useState<{ type: string; playerId: string } | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('game:state', (state: GameState) => {
      setGameState(state);
    });

    socket.on('game:event', (event: { type: string; playerId: string }) => {
      setGameEvent(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function joinGame(name: string) {
    socketRef.current?.emit('player:join', name);
  }

  function selectTile(tileId: string) {
    socketRef.current?.emit('tile:select', tileId);
  }

  function restartGame() {
    socketRef.current?.emit('game:restart');
  }

  return { gameState, gameEvent, joinGame, selectTile, restartGame };
}
