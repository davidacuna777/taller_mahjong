import { initializeApp } from 'firebase/app';
import { getDatabase, ref, runTransaction } from 'firebase/database';

const app = initializeApp({
  projectId: 'taller1-21d4b',
  appId: '1:477370730968:web:52b5cad9c2859bd0c80aad',
  databaseURL: 'https://taller1-21d4b-default-rtdb.firebaseio.com',
  storageBucket: 'taller1-21d4b.firebasestorage.app',
  apiKey: 'AIzaSyCqVrKDpjYGyMrnO6AiKg6eS9gbEk2xbxc',
  authDomain: 'taller1-21d4b.firebaseapp.com',
  messagingSenderId: '477370730968',
});

const db = getDatabase(app);
const roomRef = ref(db, 'rooms/main');

try {
  const result = await runTransaction(roomRef, (current) => {
    if (current) {
      return current;
    }

    return {
      gameState: {
        tiles: [
          {
            id: 't',
            symbol: 'A',
            isFlipped: false,
            isMatched: false,
            lockedBy: null,
          },
        ],
        scoreHistory: [],
        isGameOver: false,
        startTime: Date.now(),
        reactions: [],
      },
      players: {
        debug: {
          id: 'debug',
          name: 'debug',
          score: 0,
          isConnected: true,
        },
      },
    };
  });

  console.log('committed:', result.committed);
  console.log('hasValue:', result.snapshot.val() !== null);
} catch (error) {
  console.error('tx-error:', error?.code || '', error?.message || error);
  process.exit(1);
}
