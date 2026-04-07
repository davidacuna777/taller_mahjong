/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PowerUpType = 'STRIKE' | 'GHOST' | 'FIRE' | 'ICE';

export interface Tile {
  id: string;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  lockedBy: string | null;
  powerUp?: PowerUpType;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
  avatar?: string;
}

export interface ScoreSnapshot {
  timestamp: number;
  scores: Record<string, number>;
}

export interface Reaction {
  id: string;
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface GameState {
  tiles: Tile[];
  players: Player[];
  scoreHistory: ScoreSnapshot[];
  isGameOver: boolean;
  startTime: number | null;
  reactions: Reaction[];
}
