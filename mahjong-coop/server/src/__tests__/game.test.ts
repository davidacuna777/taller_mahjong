import { describe, it, expect } from 'vitest';
import {
  createGame,
  addPlayer,
  removePlayer,
  reconnectPlayer,
  selectTile,
  checkMatch,
  flipBackTiles,
} from '../game';
import { GameState } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeState(pairCount = 1): GameState {
  return createGame(pairCount);
}

function stateWithPlayer(state: GameState, playerId: string, name: string): GameState {
  const { newState } = addPlayer(state, playerId, name);
  return newState;
}

// ─── createGame ─────────────────────────────────────────────────────────────

describe('createGame', () => {
  it('creates pairs × 2 tiles', () => {
    const state = createGame(15);
    expect(state.tiles).toHaveLength(30);
  });

  it('all tiles start unflipped and unmatched', () => {
    const state = createGame(15);
    state.tiles.forEach((t) => {
      expect(t.isFlipped).toBe(false);
      expect(t.isMatched).toBe(false);
      expect(t.lockedBy).toBeNull();
    });
  });

  it('each symbol appears exactly twice', () => {
    const state = createGame(5);
    const counts: Record<string, number> = {};
    state.tiles.forEach((t) => { counts[t.symbol] = (counts[t.symbol] ?? 0) + 1; });
    Object.values(counts).forEach((c) => expect(c).toBe(2));
  });
});

// ─── addPlayer ──────────────────────────────────────────────────────────────

describe('addPlayer', () => {
  it('adds a player with score 0', () => {
    const state = makeState();
    const { newState, error } = addPlayer(state, 'p1', 'Alice');
    expect(error).toBeNull();
    expect(newState.players).toHaveLength(1);
    expect(newState.players[0]).toMatchObject({ id: 'p1', name: 'Alice', score: 0, isConnected: true });
  });

  it('rejects the 6th player (5-player limit)', () => {
    let state = makeState();
    for (let i = 0; i < 5; i++) {
      const r = addPlayer(state, `p${i}`, `Player${i}`);
      state = r.newState;
    }
    const { error } = addPlayer(state, 'p6', 'Extra');
    expect(error).not.toBeNull();
    expect(error).toMatch(/full/i);
  });

  it('rejects an empty name', () => {
    const state = makeState();
    const { error } = addPlayer(state, 'p1', '   ');
    expect(error).not.toBeNull();
  });

  it('trims the name before validating', () => {
    const state = makeState();
    const { newState, error } = addPlayer(state, 'p1', '  Alice  ');
    expect(error).toBeNull();
    expect(newState.players[0].name).toBe('Alice');
  });

  it('rejects duplicate name (case-insensitive)', () => {
    let state = makeState();
    ({ newState: state } = addPlayer(state, 'p1', 'Alice'));
    const { error } = addPlayer(state, 'p2', 'alice');
    expect(error).not.toBeNull();
    expect(error).toMatch(/taken/i);
  });

  it('records a scoreHistory snapshot', () => {
    const state = makeState();
    const { newState } = addPlayer(state, 'p1', 'Alice');
    const last = newState.scoreHistory[newState.scoreHistory.length - 1];
    expect(last.scores['p1']).toBe(0);
    expect(last.nameMap['p1']).toBe('Alice');
  });
});

// ─── removePlayer ────────────────────────────────────────────────────────────

describe('removePlayer', () => {
  it('sets isConnected to false', () => {
    let state = stateWithPlayer(makeState(3), 'p1', 'Alice');
    state = removePlayer(state, 'p1');
    expect(state.players[0].isConnected).toBe(false);
  });

  it('releases tiles locked by the disconnected player', () => {
    let state = stateWithPlayer(makeState(3), 'p1', 'Alice');
    // Manually lock a tile
    state = {
      ...state,
      tiles: state.tiles.map((t, i) =>
        i === 0 ? { ...t, isFlipped: true, lockedBy: 'p1' } : t
      ),
    };
    state = removePlayer(state, 'p1');
    expect(state.tiles[0].lockedBy).toBeNull();
    expect(state.tiles[0].isFlipped).toBe(false);
  });
});

// ─── selectTile ──────────────────────────────────────────────────────────────

describe('selectTile', () => {
  it('selecting the first tile flips it and locks it', () => {
    let state = stateWithPlayer(makeState(3), 'p1', 'Alice');
    const tileId = state.tiles[0].id;
    const { newState, event } = selectTile(state, tileId, 'p1');
    expect(event).toBeNull();
    const t = newState.tiles.find((t) => t.id === tileId)!;
    expect(t.isFlipped).toBe(true);
    expect(t.lockedBy).toBe('p1');
  });

  it('selecting matching second tile scores a point and marks both matched', () => {
    let state = makeState(3);
    state = stateWithPlayer(state, 'p1', 'Alice');

    // Find a matching pair
    const first = state.tiles[0];
    const second = state.tiles.find((t) => t.id !== first.id && t.symbol === first.symbol)!;

    let result = selectTile(state, first.id, 'p1');
    result = selectTile(result.newState, second.id, 'p1');

    expect(result.event).toBe('match');
    const t1 = result.newState.tiles.find((t) => t.id === first.id)!;
    const t2 = result.newState.tiles.find((t) => t.id === second.id)!;
    expect(t1.isMatched).toBe(true);
    expect(t2.isMatched).toBe(true);
    const player = result.newState.players[0];
    expect(player.score).toBe(1);
  });

  it('selecting non-matching second tile returns no-match and keeps tiles visible', () => {
    let state = makeState(3);
    state = stateWithPlayer(state, 'p1', 'Alice');

    // Find a non-matching pair
    const first = state.tiles[0];
    const nonMatch = state.tiles.find((t) => t.id !== first.id && t.symbol !== first.symbol)!;

    let result = selectTile(state, first.id, 'p1');
    result = selectTile(result.newState, nonMatch.id, 'p1');

    expect(result.event).toBe('no-match');
    // Tiles stay visible until flipBackTiles is called
    const t1 = result.newState.tiles.find((t) => t.id === first.id)!;
    const t2 = result.newState.tiles.find((t) => t.id === nonMatch.id)!;
    expect(t1.isFlipped).toBe(true);
    expect(t2.isFlipped).toBe(true);
    expect(result.noMatchTiles).toEqual([first.id, nonMatch.id]);
  });

  it('double-clicking the same tile is rejected (Fix #1)', () => {
    let state = stateWithPlayer(makeState(3), 'p1', 'Alice');
    const tileId = state.tiles[0].id;
    const { newState } = selectTile(state, tileId, 'p1');
    const result = selectTile(newState, tileId, 'p1');
    // Second click on same tile should be ignored
    expect(result.event).toBeNull();
    expect(result.newState).toEqual(newState);
  });

  it('selecting a tile locked by another player is rejected', () => {
    let state = makeState(3);
    state = stateWithPlayer(state, 'p1', 'Alice');
    state = stateWithPlayer(state, 'p2', 'Bob');

    const tileId = state.tiles[0].id;
    // p1 locks a tile
    const { newState } = selectTile(state, tileId, 'p1');
    // p2 tries to select the same tile
    const result = selectTile(newState, tileId, 'p2');
    expect(result.event).toBeNull();
    expect(result.newState).toEqual(newState);
  });
});

// ─── checkMatch ──────────────────────────────────────────────────────────────

describe('checkMatch', () => {
  it('game over when all tiles are matched', () => {
    // 1 pair = 2 tiles
    let state = makeState(1);
    state = stateWithPlayer(state, 'p1', 'Alice');

    const [t1, t2] = state.tiles;
    const { newState } = checkMatch(state, t1.id, t2.id, 'p1');
    expect(newState.isGameOver).toBe(true);
  });

  it('game not over when tiles remain', () => {
    let state = makeState(3);
    state = stateWithPlayer(state, 'p1', 'Alice');

    const first = state.tiles[0];
    const match = state.tiles.find((t) => t.id !== first.id && t.symbol === first.symbol)!;
    const { newState } = checkMatch(state, first.id, match.id, 'p1');
    expect(newState.isGameOver).toBe(false);
  });
});

// ─── flipBackTiles ───────────────────────────────────────────────────────────

describe('flipBackTiles', () => {
  it('flips tiles back face-down and releases locks', () => {
    let state = makeState(3);
    state = {
      ...state,
      tiles: state.tiles.map((t, i) =>
        i < 2 ? { ...t, isFlipped: true, lockedBy: 'p1' } : t
      ),
    };
    const [t1, t2] = state.tiles;
    const result = flipBackTiles(state, t1.id, t2.id);
    expect(result.tiles[0].isFlipped).toBe(false);
    expect(result.tiles[0].lockedBy).toBeNull();
    expect(result.tiles[1].isFlipped).toBe(false);
    expect(result.tiles[1].lockedBy).toBeNull();
  });
});

// ─── Reconnection ────────────────────────────────────────────────────────────

describe('reconnectPlayer', () => {
  it('restores isConnected and preserves score', () => {
    let state = stateWithPlayer(makeState(3), 'p1', 'Alice');
    // Manually give the player a score
    state = {
      ...state,
      players: state.players.map((p) => (p.id === 'p1' ? { ...p, score: 5 } : p)),
    };
    state = removePlayer(state, 'p1');
    expect(state.players[0].isConnected).toBe(false);

    state = reconnectPlayer(state, 'p1');
    expect(state.players[0].isConnected).toBe(true);
    expect(state.players[0].score).toBe(5);
  });
});
