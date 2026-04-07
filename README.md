# Mahjong Solitaire Live

A real-time multiplayer Mahjong Solitaire game built with React, Socket.io, and Express.

## Features

- **Real-time Multiplayer**: Compete with other players in real-time.
- **Dynamic Game Board**: 48 tiles (24 pairs) with Mahjong symbols.
- **Locking Mechanism**: Tiles are locked to the player who flips them, preventing race conditions.
- **Live Performance Chart**: Track your score evolution and compare it with other players in real-time.
- **Cyberpunk Aesthetic**: High-fidelity UI with neon effects, 3D-like transitions, and a futuristic vibe.
- **Avatar Selection**: FIFA-style avatar selector with various animal icons.
- **Reactions**: Send real-time emojis to interact with other players.
- **Responsive Design**: Optimized for desktop and mobile screens.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React.
- **Backend**: Node.js, Express, Socket.io.
- **Language**: TypeScript (Strict typing).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server (both frontend and backend):
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Building for Production

To build the project for production:
```bash
npm run build
```
The production-ready files will be in the `dist` directory.

## Game Logic

- **Matching**: Flip two tiles with the same symbol to match them and score 100 points.
- **Locking**: When you flip a tile, it is locked to you. Other players cannot flip it until you flip it back or a mismatch occurs.
- **Streaks**: Maintain a streak of matches to increase your score multiplier.
- **Game Over**: The game ends when all tiles are matched. The player with the highest score wins.

## Project Structure

- `server.ts`: Backend entry point, handles Socket.io connections and game logic.
- `src/App.tsx`: Main frontend component, manages socket connection and routing.
- `src/components/`: Reusable React components (Board, Tile, Scoreboard, LiveChart, etc.).
- `src/types.ts`: Global TypeScript interfaces and types.
- `src/services/`: Utility services (Sound, etc.).

## License

SPDX-License-Identifier: Apache-2.0
