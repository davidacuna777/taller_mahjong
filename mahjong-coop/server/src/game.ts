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

export function addPlayer(state: GameState, id: string, name: string): GameState {
  const existingIndex = state.players.findIndex((p) => p.id === id);

  let players = [...state.players];
  if (existingIndex !== -1) {
    players[existingIndex] = { ...players[existingIndex], isConnected: true };
  } else {
    players = [...players, { id, name, score: 0, isConnected: true }];
  }

  const startTime = state.startTime ?? Date.now();

  const snapshot: ScoreSnapshot = {
    timestamp: Date.now(),
    scores: Object.fromEntries(players.map((p) => [p.name, p.score])),
  };

  return {
    ...state,
    players,
    startTime,
    scoreHistory: [...state.scoreHistory, snapshot],
  };
}

export function removePlayer(state: GameState, id: string): GameState {
  const players = state.players.map((p) =>
    p.id === id ? { ...p, isConnected: false } : p
  );
  return { ...state, players };
}

export function selectTile(
  state: GameState,
  tileId: string,
  playerId: string
): { newState: GameState; event: string | null } {
  const tileIndex = state.tiles.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) {
    return { newState: state, event: null };
  }

  const tile = state.tiles[tileIndex];

  if (tile.isMatched) {
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
    const newTiles = state.tiles.map((t, i) =>
      i === tileIndex ? { ...t, isFlipped: true, lockedBy: playerId } : t
    );
    const stateWithSecondTile = { ...state, tiles: newTiles };
    const { newState, isMatch } = checkMatch(
      stateWithSecondTile,
      playerFlippedTiles[0].id,
      tileId,
      playerId
    );
    return { newState, event: isMatch ? 'match' : 'no-match' };
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
        ? { ...t, isMatched: true, lockedBy: null }
        : t
    );

    const snapshot: ScoreSnapshot = {
      timestamp: Date.now(),
      scores: Object.fromEntries(players.map((p) => [p.name, p.score])),
    };

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
    const tiles = state.tiles.map((t) =>
      t.id === tile1Id || t.id === tile2Id
        ? { ...t, isFlipped: false, lockedBy: null }
        : t
    );

    return { newState: { ...state, tiles }, isMatch: false };
  }
}
