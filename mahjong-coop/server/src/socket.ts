import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createGame,
  addPlayer,
  reconnectPlayer,
  removePlayer,
  selectTile,
  flipBackTiles,
} from './game';
import { GameState } from './types';

let gameState: GameState = createGame(15); // 15 pairs = 30 tiles

// Fix #3: maps socket.id -> playerId (UUID) for reconnection support
const socketToPlayer = new Map<string, string>();

export function setupSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    // Send current state to the newly connected client
    socket.emit('game:state', gameState);

    // When a new player joins with their name
    socket.on('player:join', (name: string) => {
      const playerId = uuidv4();
      const { newState, error } = addPlayer(gameState, playerId, name);

      if (error) {
        // Fix #5, #6: reject invalid joins with an error event
        socket.emit('player:error', error);
        return;
      }

      socketToPlayer.set(socket.id, playerId);
      gameState = newState;
      // Tell this client its playerId so it can store for reconnection
      socket.emit('player:joined', { playerId });
      io.emit('game:state', gameState);
    });

    // Fix #3: reconnection — client sends its stored playerId
    socket.on('player:rejoin', (playerId: string) => {
      const existingPlayer = gameState.players.find((p) => p.id === playerId);
      if (!existingPlayer) {
        socket.emit('player:error', 'Player not found');
        return;
      }

      socketToPlayer.set(socket.id, playerId);
      gameState = reconnectPlayer(gameState, playerId);
      socket.emit('player:joined', { playerId });
      io.emit('game:state', gameState);
    });

    // When someone clicks a tile
    socket.on('tile:select', (tileId: string) => {
      // Fix #4: reject tile:select if socket is not a registered player
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        return;
      }

      const { newState, event, noMatchTiles } = selectTile(gameState, tileId, playerId);
      gameState = newState;
      io.emit('game:state', gameState);

      if (event === 'no-match' && noMatchTiles) {
        // Fix #8: emit no-match event so clients show wrong-state feedback,
        // then flip tiles back after 1000 ms server-side
        io.emit('game:event', { type: 'no-match', playerId, tiles: noMatchTiles });
        const [t1, t2] = noMatchTiles;
        setTimeout(() => {
          gameState = flipBackTiles(gameState, t1, t2);
          io.emit('game:state', gameState);
        }, 1000);
      } else if (event) {
        io.emit('game:event', { type: event, playerId });
      }
    });

    // When someone requests a new game
    socket.on('game:restart', () => {
      gameState = createGame(15);
      socketToPlayer.clear();
      io.emit('game:state', gameState);
    });

    // When someone disconnects
    socket.on('disconnect', () => {
      const playerId = socketToPlayer.get(socket.id);
      if (playerId) {
        gameState = removePlayer(gameState, playerId);
        socketToPlayer.delete(socket.id);
        io.emit('game:state', gameState);
      }
    });
  });
}
