/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lobby, GameLayout } from './components';
import { GameState, Player } from './types';
import {
  clearMismatch,
  ensureRoomExists,
  joinRoom,
  resetRoom,
  selectTile,
  subscribeToRoom,
  type RoomData,
} from './services/firebaseGame';
import { createInitialRoom, withPlayerJoined } from './services/gameEngine';

interface SavedPlayer {
  id: string;
  name: string;
  avatar: string;
}

const STORAGE_KEY = 'mahjong-local-player';

const createPlayerId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
};

const loadSavedPlayer = (): SavedPlayer | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SavedPlayer>;
    if (parsed.id && parsed.name && parsed.avatar) {
      return { id: parsed.id, name: parsed.name, avatar: parsed.avatar };
    }
  } catch {
    return null;
  }

  return null;
};

const savePlayer = (player: SavedPlayer): void => {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(player));
};

export default function App() {
  const savedPlayer = useMemo(loadSavedPlayer, []);
  const [playerId] = useState<string>(() => savedPlayer?.id ?? createPlayerId());
  const [playerName, setPlayerName] = useState<string | null>(savedPlayer?.name ?? null);
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(savedPlayer?.avatar ?? null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const mismatchTimerRef = useRef<number | null>(null);
  const previousMatchedCount = useRef(0);
  const previousPlayerScore = useRef(0);

  useEffect(() => {
    void ensureRoomExists();

    const unsubscribe = subscribeToRoom(setRoomData, setIsConnected);

    return () => {
      unsubscribe();
      if (mismatchTimerRef.current !== null) {
        window.clearTimeout(mismatchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playerName || !playerAvatar) {
      return;
    }

    void joinRoom({
      playerId,
      name: playerName,
      avatar: playerAvatar,
    });
  }, [playerId, playerName, playerAvatar]);

  const gameState: GameState | null = useMemo(() => {
    if (!roomData) {
      return null;
    }

    const players = (Object.values(roomData.players) as Player[]).sort((a, b) => b.score - a.score);

    return {
      ...roomData.gameState,
      players,
    };
  }, [roomData]);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const matchedCount = gameState.tiles.filter((tile) => tile.isMatched).length;
    const currentPlayer = gameState.players.find((player) => player.id === playerId);
    const currentScore = currentPlayer?.score ?? 0;

    if (matchedCount > previousMatchedCount.current && currentScore > previousPlayerScore.current) {
      setStreak((value) => value + 1);
    }

    previousMatchedCount.current = matchedCount;
    previousPlayerScore.current = currentScore;
  }, [gameState, playerId]);

  useEffect(() => {
    if (!gameState || gameState.isGameOver || !gameState.startTime) return;

    const interval = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameState.startTime!) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameState?.isGameOver, gameState?.startTime]);

  const handleJoin = async (name: string, avatar: string) => {
    const trimmedName = name.trim();
    savePlayer({ id: playerId, name: trimmedName, avatar });
    setPlayerName(trimmedName);
    setPlayerAvatar(avatar);

    setRoomData((currentRoom) => {
      const nextRoom = currentRoom ?? createInitialRoom();
      return withPlayerJoined(nextRoom, playerId, trimmedName, avatar);
    });

    await joinRoom({
      playerId,
      name: trimmedName,
      avatar,
    });
  };

  const handleTileClick = async (id: string) => {
    // Limpiar cualquier timer existente antes de hacer una nueva selección
    if (mismatchTimerRef.current !== null) {
      window.clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }

    const result = await selectTile(playerId, id);

    // Si hay un mismatch, configurar timer para voltear las cartas de vuelta
    if (result.mismatchTileIds.length === 2) {
      mismatchTimerRef.current = window.setTimeout(() => {
        void clearMismatch(playerId, result.mismatchTileIds);
        mismatchTimerRef.current = null;
      }, 1000);
    }

    // Si fue un match exitoso, no incrementar el streak aquí
    // ya que se maneja en el useEffect de gameState
  };

  const handleSendReaction = () => {};

  const handlePlayAgain = () => {
    void resetRoom();
  };

  if (!playerName || !gameState) {
    return (
      <Lobby
        onJoin={handleJoin}
        connectedCount={roomData ? (Object.values(roomData.players) as Player[]).filter((player) => player.isConnected).length : 0}
        isConnected={isConnected}
      />
    );
  }

  return (
    <GameLayout
      gameState={gameState}
      elapsedTime={elapsedTime}
      currentPlayerId={playerId}
      onTileClick={handleTileClick}
      isConnected={isConnected}
      streak={streak}
      onPlayAgain={handlePlayAgain}
      onSendReaction={handleSendReaction}
    />
  );
}
