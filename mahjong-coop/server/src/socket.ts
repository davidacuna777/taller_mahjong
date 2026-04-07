import { Server as SocketIOServer, Socket } from 'socket.io';
import { createGame, addPlayer, removePlayer, selectTile } from './game';
import { GameState } from './types';

let gameState: GameState = createGame(15); // 15 pairs = 30 tiles

export function setupSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    // Send current state to the newly connected client
    socket.emit('game:state', gameState);

    // When someone joins with their name
    socket.on('player:join', (name: string) => {
      gameState = addPlayer(gameState, socket.id, name);
      io.emit('game:state', gameState); // Notify ALL clients
    });

    // When someone clicks a tile
    socket.on('tile:select', (tileId: string) => {
      const { newState, event } = selectTile(gameState, tileId, socket.id);
      gameState = newState;
      io.emit('game:state', gameState); // Notify ALL clients

      // If it was a no-match, schedule a flip-back after a delay
      // The delay is handled client-side for visual purposes,
      // but we emit the event so clients know what happened
      if (event) {
        io.emit('game:event', { type: event, playerId: socket.id });
      }
    });

    // When someone requests a new game
    socket.on('game:restart', () => {
      gameState = createGame(15);
      // Players will need to re-join after a restart
      io.emit('game:state', gameState);
    });

    // When someone disconnects
    socket.on('disconnect', () => {
      gameState = removePlayer(gameState, socket.id);
      io.emit('game:state', gameState);
    });
  });
}
