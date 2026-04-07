import { initializeApp } from 'firebase/app';
import {
  DatabaseReference,
  Unsubscribe,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  runTransaction,
} from 'firebase/database';
import { Player } from '../types';
import {
  applyTileSelection,
  createInitialRoom,
  normalizeRoom,
  resolveMismatch,
  withGameReset,
  withPlayerJoined,
  withPlayerDisconnected,
  type RoomData,
} from './gameEngine';

const firebaseApp = initializeApp({
  projectId: 'taller1-21d4b',
  appId: '1:477370730968:web:52b5cad9c2859bd0c80aad',
  databaseURL: 'https://taller1-21d4b-default-rtdb.firebaseio.com',
  storageBucket: 'taller1-21d4b.firebasestorage.app',
  apiKey: 'AIzaSyCqVrKDpjYGyMrnO6AiKg6eS9gbEk2xbxc',
  authDomain: 'taller1-21d4b.firebaseapp.com',
  messagingSenderId: '477370730968',
});

const database = getDatabase(firebaseApp);
const ROOM_PATH = 'rooms/main';

const roomRef = ref(database, ROOM_PATH);
const connectionRef = ref(database, '.info/connected');

export interface JoinRoomInput {
  playerId: string;
  name: string;
  avatar: string;
}

export interface TileSelectionOutcome {
  mismatchTileIds: string[];
  matched: boolean;
}

export const subscribeToRoom = (
  onRoomChange: (room: RoomData | null) => void,
  onConnectionChange: (connected: boolean) => void,
): (() => void) => {
  const unsubscribeRoom = onValue(roomRef, (snapshot) => {
    const roomData = normalizeRoom(snapshot.val());
    onRoomChange(roomData);
  }, (error) => {
    console.error('Error subscribing to room:', error);
    onRoomChange(null);
  });

  const unsubscribeConnection = onValue(connectionRef, (snapshot) => {
    onConnectionChange(Boolean(snapshot.val()));
  }, (error) => {
    console.error('Error checking connection:', error);
    onConnectionChange(false);
  });

  return () => {
    unsubscribeRoom();
    unsubscribeConnection();
  };
};

export const ensureRoomExists = async (): Promise<void> => {
  await runTransaction(roomRef, (currentValue) => {
    const room = normalizeRoom(currentValue);
    if (room) {
      return currentValue;
    }
    return createInitialRoom();
  });
};

export const joinRoom = async ({ playerId, name, avatar }: JoinRoomInput): Promise<void> => {
  await ensureRoomExists();
  await runTransaction(roomRef, (currentValue) => {
    const room = normalizeRoom(currentValue) ?? createInitialRoom();
    return withPlayerJoined(room, playerId, name, avatar);
  });

  await onDisconnect(ref(database, `${ROOM_PATH}/players/${playerId}/isConnected`)).set(false);
};

export const disconnectPlayer = async (playerId: string): Promise<void> => {
  await runTransaction(roomRef, (currentValue) => {
    const room = normalizeRoom(currentValue);
    if (!room) {
      return currentValue;
    }
    return withPlayerDisconnected(room, playerId);
  });
};

export const selectTile = async (
  playerId: string,
  tileId: string,
): Promise<TileSelectionOutcome> => {
  let outcome: TileSelectionOutcome = { mismatchTileIds: [], matched: false };

  await runTransaction(roomRef, (currentValue) => {
    const room = normalizeRoom(currentValue);
    if (!room) {
      return currentValue ?? createInitialRoom();
    }

    const result = applyTileSelection(room, playerId, tileId);
    outcome = {
      mismatchTileIds: result.mismatchTileIds,
      matched: result.matched,
    };
    return result.room;
  });

  return outcome;
};

export const clearMismatch = async (playerId: string, tileIds: string[]): Promise<void> => {
  await runTransaction(roomRef, (currentValue) => {
    const room = normalizeRoom(currentValue);
    if (!room) {
      return currentValue;
    }
    return resolveMismatch(room, playerId, tileIds);
  });
};

export const resetRoom = async (): Promise<void> => {
  await runTransaction(roomRef, (currentValue) => {
    const room = normalizeRoom(currentValue);
    if (!room) {
      return createInitialRoom();
    }
    return withGameReset(room);
  });
};

export type { RoomData, Player, DatabaseReference, Unsubscribe };
