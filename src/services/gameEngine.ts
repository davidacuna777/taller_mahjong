import { GameState, Player, PowerUpType, Tile } from '../types';

const SYMBOLS = ['🀀', '🀁', '🀂', '🀃', '🀄', '🀅', '🀆', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗'];
const POWER_UPS: PowerUpType[] = ['STRIKE', 'FIRE', 'ICE', 'GHOST'];

export interface RoomData {
  gameState: Omit<GameState, 'players'>;
  players: Record<string, Player>;
}

export interface TileSelectionResult {
  room: RoomData;
  mismatchTileIds: string[];
  matched: boolean;
}

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const createTiles = (): Tile[] => {
  const tiles: Tile[] = [];

  for (let index = 0; index < 24; index += 1) {
    const symbol = SYMBOLS[index % SYMBOLS.length];
    const hasPowerUp = Math.random() > 0.85;
    const powerUp = hasPowerUp ? POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)] : undefined;

    tiles.push({
      id: `tile-${index}-a`,
      symbol,
      isFlipped: false,
      isMatched: false,
      lockedBy: null,
      powerUp,
    });
    tiles.push({
      id: `tile-${index}-b`,
      symbol,
      isFlipped: false,
      isMatched: false,
      lockedBy: null,
      powerUp,
    });
  }

  return shuffle(tiles);
};

const createScoreSnapshot = (players: Record<string, Player>) => ({
  timestamp: Date.now(),
  scores: Object.fromEntries(Object.values(players).map((player) => [player.id, player.score])),
});

const cloneRoom = (room: RoomData): RoomData => ({
  gameState: {
    ...room.gameState,
    tiles: room.gameState.tiles.map((tile) => ({ ...tile })),
    scoreHistory: room.gameState.scoreHistory.map((snapshot) => ({
      timestamp: snapshot.timestamp,
      scores: { ...snapshot.scores },
    })),
    reactions: room.gameState.reactions.map((reaction) => ({ ...reaction })),
  },
  players: Object.fromEntries(Object.entries(room.players).map(([id, player]) => [id, { ...player }])),
});

export const createInitialRoom = (): RoomData => ({
  gameState: {
    tiles: createTiles(),
    scoreHistory: [],
    isGameOver: false,
    startTime: Date.now(),
    reactions: [],
  },
  players: {},
});

export const normalizeRoom = (value: unknown): RoomData | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const room = value as Partial<RoomData>;
  if (!room.gameState || !Array.isArray(room.gameState.tiles) || !room.players) {
    return null;
  }

  return {
    gameState: {
      tiles: room.gameState.tiles as Tile[],
      scoreHistory: Array.isArray(room.gameState.scoreHistory) ? room.gameState.scoreHistory : [],
      isGameOver: Boolean(room.gameState.isGameOver),
      startTime: room.gameState.startTime ?? Date.now(),
      reactions: Array.isArray(room.gameState.reactions) ? room.gameState.reactions : [],
    },
    players: room.players as Record<string, Player>,
  };
};

export const withPlayerJoined = (room: RoomData, playerId: string, name: string, avatar: string): RoomData => {
  const nextRoom = cloneRoom(room);
  const existingPlayer = nextRoom.players[playerId];

  nextRoom.players[playerId] = {
    id: playerId,
    name: name.trim(),
    avatar,
    score: existingPlayer?.score ?? 0,
    isConnected: true,
  };

  if (!nextRoom.gameState.startTime) {
    nextRoom.gameState.startTime = Date.now();
  }

  nextRoom.gameState.scoreHistory = [
    ...nextRoom.gameState.scoreHistory,
    createScoreSnapshot(nextRoom.players),
  ];

  return nextRoom;
};

export const withPlayerDisconnected = (room: RoomData, playerId: string): RoomData => {
  const nextRoom = cloneRoom(room);
  const player = nextRoom.players[playerId];
  if (!player) {
    return nextRoom;
  }

  player.isConnected = false;

  nextRoom.gameState.tiles = nextRoom.gameState.tiles.map((tile) =>
    tile.lockedBy === playerId ? { ...tile, isFlipped: false, lockedBy: null } : tile,
  );

  return nextRoom;
};

export const withGameReset = (room: RoomData): RoomData => {
  const nextRoom = cloneRoom(room);
  nextRoom.gameState = {
    tiles: createTiles(),
    scoreHistory: [],
    isGameOver: false,
    startTime: Date.now(),
    reactions: [],
  };

  nextRoom.players = Object.fromEntries(
    Object.values(nextRoom.players).map((player) => [player.id, { ...player, score: 0 }]),
  );

  nextRoom.gameState.scoreHistory = [createScoreSnapshot(nextRoom.players)];

  return nextRoom;
};

export const applyTileSelection = (
  room: RoomData,
  playerId: string,
  tileId: string,
): TileSelectionResult => {
  const nextRoom = cloneRoom(room);
  const targetTile = nextRoom.gameState.tiles.find((tile) => tile.id === tileId);

  if (!targetTile || targetTile.isMatched) {
    return { room: nextRoom, mismatchTileIds: [], matched: false };
  }

  const isLockedByAnotherPlayer = targetTile.lockedBy !== null && targetTile.lockedBy !== playerId;
  if (isLockedByAnotherPlayer) {
    return { room: nextRoom, mismatchTileIds: [], matched: false };
  }

  if (targetTile.lockedBy === playerId) {
    targetTile.isFlipped = false;
    targetTile.lockedBy = null;
    return { room: nextRoom, mismatchTileIds: [], matched: false };
  }

  const flippedByPlayer = nextRoom.gameState.tiles.filter(
    (tile) => tile.lockedBy === playerId && tile.isFlipped && !tile.isMatched,
  );
  if (flippedByPlayer.length >= 2) {
    return { room: nextRoom, mismatchTileIds: [], matched: false };
  }

  targetTile.isFlipped = true;
  targetTile.lockedBy = playerId;

  const newlyFlippedByPlayer = nextRoom.gameState.tiles.filter(
    (tile) => tile.lockedBy === playerId && tile.isFlipped && !tile.isMatched,
  );

  if (newlyFlippedByPlayer.length !== 2) {
    return { room: nextRoom, mismatchTileIds: [], matched: false };
  }

  const [firstTile, secondTile] = newlyFlippedByPlayer;
  if (firstTile.symbol === secondTile.symbol) {
    firstTile.isMatched = true;
    secondTile.isMatched = true;
    firstTile.lockedBy = null;
    secondTile.lockedBy = null;

    const player = nextRoom.players[playerId];
    if (player) {
      player.score += 100;
    }

    nextRoom.gameState.scoreHistory = [
      ...nextRoom.gameState.scoreHistory,
      createScoreSnapshot(nextRoom.players),
    ];

    nextRoom.gameState.isGameOver = nextRoom.gameState.tiles.every((tile) => tile.isMatched);

    return { room: nextRoom, mismatchTileIds: [], matched: true };
  }

  return {
    room: nextRoom,
    mismatchTileIds: [firstTile.id, secondTile.id],
    matched: false,
  };
};

export const resolveMismatch = (
  room: RoomData,
  playerId: string,
  tileIds: string[],
): RoomData => {
  const nextRoom = cloneRoom(room);
  nextRoom.gameState.tiles = nextRoom.gameState.tiles.map((tile) => {
    if (tileIds.includes(tile.id) && tile.lockedBy === playerId && tile.isFlipped && !tile.isMatched) {
      return { ...tile, isFlipped: false, lockedBy: null };
    }
    return tile;
  });
  return nextRoom;
};
