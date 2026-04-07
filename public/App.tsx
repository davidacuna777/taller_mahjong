/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lobby, GameLayout } from './components';
import { GameState, Player, Tile, PowerUpType, Reaction } from './types';
import { io, Socket } from 'socket.io-client';

export default function App() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  // Socket Connection
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('stateUpdate', (newState: GameState) => {
      setGameState(prev => {
        if (prev && newState) {
          const prevMatched = prev.tiles.filter(t => t.isMatched).length;
          const nextMatched = newState.tiles.filter(t => t.isMatched).length;
          if (nextMatched > prevMatched) {
            // Check if the match was by me
            const myPrevScore = prev.players.find(p => p.id === socket.id)?.score || 0;
            const myNextScore = newState.players.find(p => p.id === socket.id)?.score || 0;
            if (myNextScore > myPrevScore) {
              setStreak(s => s + 1);
            }
          } else if (newState.tiles.filter(t => t.isFlipped && !t.isMatched && t.lockedBy === socket.id).length === 0 && 
                     prev.tiles.filter(t => t.isFlipped && !t.isMatched && t.lockedBy === socket.id).length === 2) {
            // Mismatch happened (tiles flipped back)
            setStreak(0);
          }
        }
        return newState;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!gameState || gameState.isGameOver || !gameState.startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameState.startTime!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.isGameOver, gameState?.startTime]);

  const handleJoin = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    socketRef.current?.emit('join', { name, avatar });
  };

  const handleTileClick = (id: string) => {
    socketRef.current?.emit('flipTile', id);
  };

  const handleSendReaction = (emoji: string) => {
    socketRef.current?.emit('reaction', emoji);
  };

  const handlePlayAgain = () => {
    socketRef.current?.emit('reset');
  };

  if (!playerName || !gameState) {
    return <Lobby onJoin={handleJoin} connectedCount={gameState?.players.length || 0} />;
  }

  return (
    <GameLayout
      gameState={gameState}
      elapsedTime={elapsedTime}
      currentPlayerId={socketRef.current?.id || ''}
      onTileClick={handleTileClick}
      isConnected={isConnected}
      streak={streak}
      onPlayAgain={handlePlayAgain}
      onSendReaction={handleSendReaction}
    />
  );
}
