import { GameState, Tile, ScoreSnapshot } from './types';

const MAHJONG_SYMBOLS = [
  '🀄', '🎋', '🎍', '🏮', '🐉', '🐦', '🌸', '🎎',
  '🎏', '🎑', '🌊', '🍵', '🎴', '🏯', '🌙',
];

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildSnapshot(players: GameState['players']): ScoreSnapshot {
  return {
    timestamp: Date.now(),
    scores: Object.fromEntries(players.map((p) => [p.id, p.score])),
    nameMap: Object.fromEntries(players.map((p) => [p.id, p.name])),
  };
}

export function createGame(pairCount: number): GameState {
  const symbols = MAHJONG_SYMBOLS.slice(0, pairCount);
  const tilePairs: Tile[] = [];

  symbols.forEach((symbol, index) => {
    tilePairs.push(
      {
        id: `tile-${index * 2}`,
        symbol,
        isFlipped: false,
        isMatched: false,
        lockedBy: null,
      },
      {
        id: `tile-${index * 2 + 1}`,
        symbol,
        isFlipped: false,
        isMatched: false,
        lockedBy: null,
      }
    );
  });

  const tiles = fisherYatesShuffle(tilePairs);

  return {
    tiles,
    players: [],
    scoreHistory: [],
    isGameOver: false,
    startTime: null,
  };
}

/**
 * Adds a new player. Returns an error string if validation fails.
 * Fix #5: enforces max 5 connected players.
 * Fix #6: trims name, rejects empty and duplicate (case-insensitive) names.
 * Fix #7: scoreHistory keyed by playerId with nameMap.
 */
export function addPlayer(
  state: GameState,
  playerId: string,
  name: string
): { newState: GameState; error: string | null } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { newState: state, error: 'Name cannot be empty' };
  }

  const activePlayers = state.players.filter((p) => p.isConnected);

  // Reject duplicate names among active players (case-insensitive)
  const isDuplicate = activePlayers.some(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    return { newState: state, error: 'Name already taken' };
  }

  // Enforce 5-player limit for new players
  if (activePlayers.length >= 5) {
    return { newState: state, error: 'Lobby is full (max 5 players)' };
  }

  const players = [
    ...state.players,
    { id: playerId, name: trimmed, score: 0, isConnected: true },
  ];

  const startTime = state.startTime ?? Date.now();
  const snapshot = buildSnapshot(players);

  return {
    newState: {
      ...state,
      players,
      startTime,
      scoreHistory: [...state.scoreHistory, snapshot],
    },
    error: null,
  };
}

/**
 * Marks an existing player as reconnected.
 * Fix #3: reconnection maintains player identity and score.
 */
export function reconnectPlayer(state: GameState, playerId: string): GameState {
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, isConnected: true } : p
  );
  return { ...state, players };
}

/**
 * Marks a player as disconnected and releases any tiles they had locked.
 * Fix #2: locked tiles are freed when the player disconnects.
 */
export function removePlayer(state: GameState, id: string): GameState {
  const players = state.players.map((p) =>
    p.id === id ? { ...p, isConnected: false } : p
  );
  // Release tiles locked by this player
  const tiles = state.tiles.map((t) =>
    t.lockedBy === id ? { ...t, isFlipped: false, lockedBy: null } : t
  );
  return { ...state, players, tiles };
}

export function selectTile(
  state: GameState,
  tileId: string,
  playerId: string
): { newState: GameState; event: string | null; noMatchTiles?: [string, string] } {
  const tileIndex = state.tiles.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) {
    return { newState: state, event: null };
  }

  const tile = state.tiles[tileIndex];

  if (tile.isMatched) {
    return { newState: state, event: null };
  }

  // Fix #1: reject if this tile is already flipped/locked by this player (double-click guard)
  if (tile.lockedBy === playerId && tile.isFlipped) {
    return { newState: state, event: null };
  }

  if (tile.lockedBy !== null && tile.lockedBy !== playerId) {
    return { newState: state, event: null };
  }

  const playerFlippedTiles = state.tiles.filter(
    (t) => t.lockedBy === playerId && !t.isMatched
  );

  if (playerFlippedTiles.length === 0) {
    const newTiles = state.tiles.map((t, i) =>
      i === tileIndex ? { ...t, isFlipped: true, lockedBy: playerId } : t
    );
    return { newState: { ...state, tiles: newTiles }, event: null };
  }

  if (playerFlippedTiles.length === 1) {
    const firstTile = playerFlippedTiles[0];
    const newTiles = state.tiles.map((t, i) =>
      i === tileIndex ? { ...t, isFlipped: true, lockedBy: playerId } : t
    );
    const stateWithSecondTile = { ...state, tiles: newTiles };
    const { newState, isMatch } = checkMatch(
      stateWithSecondTile,
      firstTile.id,
      tileId,
      playerId
    );
    if (isMatch) {
      return { newState, event: 'match' };
    }
    // Fix #8: return tile IDs for no-match so server can schedule flip-back
    return { newState, event: 'no-match', noMatchTiles: [firstTile.id, tileId] };
  }

  // Player already has 2 tiles selected — ignore
  return { newState: state, event: null };
}

export function checkMatch(
  state: GameState,
  tile1Id: string,
  tile2Id: string,
  playerId: string
): { newState: GameState; isMatch: boolean } {
  const tile1 = state.tiles.find((t) => t.id === tile1Id);
  const tile2 = state.tiles.find((t) => t.id === tile2Id);

  if (!tile1 || !tile2) {
    return { newState: state, isMatch: false };
  }

  if (tile1.symbol === tile2.symbol) {
    const players = state.players.map((p) =>
      p.id === playerId ? { ...p, score: p.score + 1 } : p
    );

    const tiles = state.tiles.map((t) =>
      t.id === tile1Id || t.id === tile2Id
        ? { ...t, isMatched: true, isFlipped: true, lockedBy: null }
        : t
    );

    const snapshot = buildSnapshot(players);
    const isGameOver = tiles.every((t) => t.isMatched);

    return {
      newState: {
        ...state,
        tiles,
        players,
        scoreHistory: [...state.scoreHistory, snapshot],
        isGameOver,
      },
      isMatch: true,
    };
  } else {
    // Fix #8: keep tiles flipped; socket.ts schedules flip-back after delay
    return { newState: state, isMatch: false };
  }
}

/**
 * Flips two tiles back face-down and releases their locks.
 * Called by socket.ts after a no-match delay (Fix #8).
 */
export function flipBackTiles(
  state: GameState,
  tile1Id: string,
  tile2Id: string
): GameState {
  const tiles = state.tiles.map((t) =>
    t.id === tile1Id || t.id === tile2Id
      ? { ...t, isFlipped: false, lockedBy: null }
      : t
  );
  return { ...state, tiles };
}
