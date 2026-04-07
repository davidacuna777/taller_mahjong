import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GameState, Player, Tile, PowerUpType, Reaction } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYMBOLS = ['🀀', '🀁', '🀂', '🀃', '🀄', '🀅', '🀆', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗'];
const POWER_UPS: PowerUpType[] = ['STRIKE', 'FIRE', 'ICE', 'GHOST'];

const generateTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  for (let i = 0; i < 24; i++) {
    const symbol = SYMBOLS[i % SYMBOLS.length];
    const hasPowerUp = Math.random() > 0.85;
    const powerUp = hasPowerUp ? POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)] : undefined;

    tiles.push({
      id: `tile-${i}-a`,
      symbol,
      isFlipped: false,
      isMatched: false,
      lockedBy: null,
      powerUp,
    });
    tiles.push({
      id: `tile-${i}-b`,
      symbol,
      isFlipped: false,
      isMatched: false,
      lockedBy: null,
      powerUp,
    });
  }
  return tiles.sort(() => Math.random() - 0.5);
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  let gameState: GameState = {
    tiles: generateTiles(),
    players: [],
    scoreHistory: [],
    isGameOver: false,
    startTime: null,
    reactions: [],
  };

  const broadcastState = () => {
    io.emit('stateUpdate', gameState);
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', ({ name, avatar }) => {
      const existingPlayer = gameState.players.find(p => p.id === socket.id);
      if (!existingPlayer) {
        const newPlayer: Player = {
          id: socket.id,
          name,
          avatar,
          score: 0,
          isConnected: true,
        };
        gameState.players.push(newPlayer);
        
        if (gameState.players.length === 1 && !gameState.startTime) {
          gameState.startTime = Date.now();
          gameState.scoreHistory = [{
            timestamp: gameState.startTime,
            scores: { [socket.id]: 0 }
          }];
        } else if (gameState.startTime) {
           // Update score history with new player
           const lastHistory = gameState.scoreHistory[gameState.scoreHistory.length - 1];
           if (lastHistory) {
             gameState.scoreHistory.push({
               timestamp: Date.now(),
               scores: { ...lastHistory.scores, [socket.id]: 0 }
             });
           }
        }
      }
      broadcastState();
    });

    socket.on('flipTile', (tileId) => {
      if (gameState.isGameOver) return;

      const tile = gameState.tiles.find(t => t.id === tileId);
      if (!tile || tile.isMatched) return;
      
      // If tile is locked by someone else, can't flip
      if (tile.lockedBy && tile.lockedBy !== socket.id) return;

      // Toggle flip
      if (tile.lockedBy === socket.id) {
        tile.isFlipped = false;
        tile.lockedBy = null;
      } else {
        // Check how many tiles this player has flipped
        const flippedByMe = gameState.tiles.filter(t => t.lockedBy === socket.id && t.isFlipped && !t.isMatched);
        if (flippedByMe.length >= 2) return;

        tile.isFlipped = true;
        tile.lockedBy = socket.id;

        // Check for match if this was the second tile
        const newlyFlippedByMe = gameState.tiles.filter(t => t.lockedBy === socket.id && t.isFlipped && !t.isMatched);
        if (newlyFlippedByMe.length === 2) {
          const [t1, t2] = newlyFlippedByMe;
          if (t1.symbol === t2.symbol) {
            // Match!
            t1.isMatched = true;
            t2.isMatched = true;
            t1.lockedBy = null;
            t2.lockedBy = null;

            const player = gameState.players.find(p => p.id === socket.id);
            if (player) {
              player.score += 100;
              gameState.scoreHistory.push({
                timestamp: Date.now(),
                scores: Object.fromEntries(gameState.players.map(p => [p.id, p.score]))
              });
            }

            if (gameState.tiles.every(t => t.isMatched)) {
              gameState.isGameOver = true;
            }
          } else {
            // Mismatch - will be flipped back by client or after a delay
            setTimeout(() => {
              const stillFlipped = gameState.tiles.filter(t => t.lockedBy === socket.id && t.isFlipped && !t.isMatched);
              if (stillFlipped.length === 2) {
                stillFlipped.forEach(t => {
                  t.isFlipped = false;
                  t.lockedBy = null;
                });
                broadcastState();
              }
            }, 1000);
          }
        }
      }
      broadcastState();
    });

    socket.on('reaction', (emoji) => {
      const reaction: Reaction = {
        id: Math.random().toString(36).substr(2, 9),
        playerId: socket.id,
        emoji,
        timestamp: Date.now(),
      };
      gameState.reactions.push(reaction);
      broadcastState();

      // Cleanup reaction after 3 seconds
      setTimeout(() => {
        gameState.reactions = gameState.reactions.filter(r => r.id !== reaction.id);
        broadcastState();
      }, 3000);
    });

    socket.on('reset', () => {
      gameState = {
        tiles: generateTiles(),
        players: gameState.players.map(p => ({ ...p, score: 0 })),
        scoreHistory: [],
        isGameOver: false,
        startTime: Date.now(),
        reactions: [],
      };
      broadcastState();
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      const player = gameState.players.find(p => p.id === socket.id);
      if (player) {
        player.isConnected = false;
      }
      broadcastState();
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
