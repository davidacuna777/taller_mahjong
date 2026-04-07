export interface Tile {
  id: string;           // Unique tile identifier (e.g., "tile-0")
  symbol: string;       // The emoji/symbol representing the tile
  isFlipped: boolean;   // Whether the tile is face-up (visible)
  isMatched: boolean;   // Whether it's been matched (removed from play)
  lockedBy: string | null; // playerId (UUID) of player who selected it, or null
}

export interface Player {
  id: string;           // UUID playerId (distinct from socket.id)
  name: string;         // Name the player entered
  score: number;        // Accumulated score
  isConnected: boolean; // Whether currently connected
}

export interface ScoreSnapshot {
  timestamp: number;                  // Exact moment of the snapshot (Date.now())
  scores: Record<string, number>;     // { playerId: score, ... }
  nameMap: Record<string, string>;    // { playerId: playerName, ... }
}

export interface GameState {
  tiles: Tile[];                // All tiles on the board
  players: Player[];            // All players (connected and disconnected)
  scoreHistory: ScoreSnapshot[]; // History for the live chart
  isGameOver: boolean;          // Whether the game has ended
  startTime: number | null;     // Start timestamp (to calculate duration)
}
