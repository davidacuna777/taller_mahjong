import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSocket } from './hooks/useSocket';
import type { Tile, Player } from './types';
import './App.css';

// ─── Tile colours per player slot ──────────────────────────────────────────
const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

function playerColor(players: Player[], playerId: string | null): string {
  if (!playerId) return '#888';
  const idx = players.findIndex((p) => p.id === playerId);
  return idx >= 0 ? PLAYER_COLORS[idx % PLAYER_COLORS.length] : '#888';
}

// ─── TileCard ───────────────────────────────────────────────────────────────
interface TileCardProps {
  tile: Tile;
  myPlayerId: string | null;
  players: Player[];
  noMatchIds: Set<string>;
  onSelect: (id: string) => void;
}

function TileCard({ tile, myPlayerId, players, noMatchIds, onSelect }: TileCardProps) {
  const isLockedByMe = tile.lockedBy === myPlayerId;
  const isLockedByOther = tile.lockedBy !== null && !isLockedByMe;
  const isNoMatch = noMatchIds.has(tile.id);

  let className = 'tile';
  if (tile.isMatched) className += ' matched';
  else if (isNoMatch) className += ' no-match';
  else if (isLockedByMe) className += ' locked-mine';
  else if (isLockedByOther) className += ' locked-other';
  else if (tile.isFlipped) className += ' flipped';

  const borderColor = isLockedByOther
    ? playerColor(players, tile.lockedBy)
    : isLockedByMe
    ? playerColor(players, myPlayerId)
    : undefined;

  return (
    <button
      className={className}
      style={borderColor ? { borderColor, boxShadow: `0 0 8px ${borderColor}` } : undefined}
      disabled={tile.isMatched || isLockedByOther || (tile.isFlipped && !isLockedByMe)}
      onClick={() => onSelect(tile.id)}
      aria-label={tile.isFlipped || tile.isMatched ? tile.symbol : 'Hidden tile'}
    >
      <span className="tile-face">{tile.symbol}</span>
      <span className="tile-back">🀫</span>
    </button>
  );
}

// ─── Scoreboard ─────────────────────────────────────────────────────────────
function Scoreboard({ players, myPlayerId }: { players: Player[]; myPlayerId: string | null }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="scoreboard">
      <h3>Scores</h3>
      <ul>
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className={p.id === myPlayerId ? 'me' : ''}
            style={{ color: PLAYER_COLORS[players.findIndex((pl) => pl.id === p.id) % PLAYER_COLORS.length] }}
          >
            {i + 1}. {p.name}
            {p.id === myPlayerId ? ' (you)' : ''}
            {!p.isConnected ? ' 🔌' : ''}
            <span className="score-val">{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Score chart ─────────────────────────────────────────────────────────────
function ScoreChart({ players, scoreHistory }: {
  players: Player[];
  scoreHistory: { timestamp: number; scores: Record<string, number>; nameMap: Record<string, string> }[];
}) {
  if (scoreHistory.length < 2) return null;

  const data = scoreHistory.map((snap) => {
    const point: Record<string, number | string> = {
      t: Math.round((snap.timestamp - scoreHistory[0].timestamp) / 1000),
    };
    players.forEach((p) => {
      point[p.name] = snap.scores[p.id] ?? 0;
    });
    return point;
  });

  return (
    <div className="chart-container">
      <h3>Score History</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="t" label={{ value: 's', position: 'insideRight' }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          {players.map((p, i) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.name}
              stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const {
    gameState,
    gameEvent,
    playerId,
    playerError,
    joinGame,
    selectTile,
    restartGame,
  } = useSocket();

  const [nameInput, setNameInput] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; kind: 'match' | 'no-match' } | null>(null);
  const [noMatchIds, setNoMatchIds] = useState<Set<string>>(new Set());

  // Handle game events
  useEffect(() => {
    if (!gameEvent) return;
    if (gameEvent.type === 'match') {
      setFeedback({ msg: '✅ Match!', kind: 'match' });
      setTimeout(() => setFeedback(null), 1200);
    } else if (gameEvent.type === 'no-match') {
      setFeedback({ msg: '❌ No match', kind: 'no-match' });
      if (gameEvent.tiles) {
        setNoMatchIds(new Set(gameEvent.tiles));
        setTimeout(() => {
          setNoMatchIds(new Set());
          setFeedback(null);
        }, 1000);
      } else {
        setTimeout(() => setFeedback(null), 1000);
      }
    }
  }, [gameEvent]);

  const handleJoin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = nameInput.trim();
      if (trimmed) joinGame(trimmed);
    },
    [nameInput, joinGame]
  );

  const handleSelectTile = useCallback(
    (id: string) => selectTile(id),
    [selectTile]
  );

  // ── Login screen ────────────────────────────────────────────────────────
  const isJoined = playerId !== null && gameState?.players.some((p) => p.id === playerId);

  if (!gameState) {
    return (
      <div className="loading">
        <p>Connecting to server…</p>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="login-screen">
        <h1>🀄 Mahjong Coop</h1>
        <p className="subtitle">Collaborative memory matching — up to 5 players</p>
        <form onSubmit={handleJoin} className="login-form">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            autoFocus
          />
          <button type="submit" disabled={!nameInput.trim()}>
            Join Game
          </button>
        </form>
        {playerError && <p className="error-msg">{playerError}</p>}
        {gameState.players.filter((p) => p.isConnected).length > 0 && (
          <div className="waiting-players">
            <h3>Players in lobby:</h3>
            <ul>
              {gameState.players
                .filter((p) => p.isConnected)
                .map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ── Game over screen ─────────────────────────────────────────────────────
  if (gameState.isGameOver) {
    const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
    return (
      <div className="gameover-screen">
        <h1>🎉 Game Over!</h1>
        <ol className="final-scores">
          {sorted.map((p, i) => (
            <li key={p.id}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}{' '}
              {p.name} — {p.score} pt{p.score !== 1 ? 's' : ''}
            </li>
          ))}
        </ol>
        <ScoreChart players={gameState.players} scoreHistory={gameState.scoreHistory} />
        <button className="restart-btn" onClick={restartGame}>
          🔄 New Game
        </button>
      </div>
    );
  }

  // ── Main game screen ──────────────────────────────────────────────────────
  const cols = Math.ceil(Math.sqrt(gameState.tiles.length));

  return (
    <div className="game-screen">
      <header className="game-header">
        <h1>🀄 Mahjong Coop</h1>
        {feedback && (
          <div className={`feedback feedback-${feedback.kind}`}>{feedback.msg}</div>
        )}
      </header>

      <div className="game-body">
        <main>
          <div
            className="board"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {gameState.tiles.map((tile) => (
              <TileCard
                key={tile.id}
                tile={tile}
                myPlayerId={playerId}
                players={gameState.players}
                noMatchIds={noMatchIds}
                onSelect={handleSelectTile}
              />
            ))}
          </div>
        </main>

        <aside className="sidebar">
          <Scoreboard players={gameState.players} myPlayerId={playerId} />
          <ScoreChart
            players={gameState.players}
            scoreHistory={gameState.scoreHistory}
          />
          <button className="restart-btn small" onClick={restartGame}>
            🔄 Restart
          </button>
        </aside>
      </div>
    </div>
  );
}
