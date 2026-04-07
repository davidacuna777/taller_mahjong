/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import { Tile as TileType, Player } from '../types';
import { Tile } from './Tile';

interface BoardProps {
  /** Array of all tiles in the game */
  tiles: TileType[];
  /** ID of the current local player */
  currentPlayerId: string;
  /** Callback when a tile is clicked */
  onTileClick: (id: string) => void;
  /** Whether the game has ended */
  isGameOver: boolean;
  /** List of all players for the game over screen */
  players: Player[];
  /** Callback to restart the game */
  onPlayAgain?: () => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
}

/**
 * Main game board component that renders the grid of tiles and the game over overlay.
 * Optimized for smaller tiles and fluid layout.
 */
export const Board: React.FC<BoardProps> = React.memo(({ 
  tiles, 
  currentPlayerId, 
  onTileClick, 
  isGameOver, 
  players,
  onPlayAgain 
}) => {
  const [mismatchedIds, setMismatchedIds] = useState<string[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevMatchedCount = React.useRef(0);

  // Preserve incoming order from server to keep shuffled layout on board.
  const boardTiles = tiles;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const podium = sortedPlayers.slice(0, 3);

  const createExplosion = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    const colors = ['#00d4ff', '#22c55e', '#ffd700', '#ef4444', '#bf00ff'];
    
    for (let i = 0; i < 16; i++) {
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, []);

  // Logic to detect mismatch and trigger particles on match
  useEffect(() => {
    const flippedByMe = tiles.filter(t => t.lockedBy === currentPlayerId && t.isFlipped && !t.isMatched);
    
    if (flippedByMe.length === 2) {
      const [t1, t2] = flippedByMe;
      if (t1.symbol !== t2.symbol) {
        setMismatchedIds([t1.id, t2.id]);
        const timer = setTimeout(() => setMismatchedIds([]), 600);
        return () => clearTimeout(timer);
      }
    }

    const matchedCount = tiles.filter(t => t.isMatched).length;
    if (matchedCount > prevMatchedCount.current) {
      // New match detected! Trigger explosion in the center of the board for now
      // or we could try to find the last flipped tiles
      createExplosion(window.innerWidth / 2, window.innerHeight / 2);
    }
    prevMatchedCount.current = matchedCount;
  }, [tiles, currentPlayerId, createExplosion]);

  // Wrap tile click to potentially trigger effects
  const handleTileClick = (id: string) => {
    onTileClick(id);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 p-4 md:p-6 rounded-2xl border border-jade-900/30 overflow-hidden shadow-inner">
      {/* Grid background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-w-5xl mx-auto relative z-10">
        {boardTiles.map((tile, index) => (
          <Tile 
            key={tile.id} 
            tile={tile} 
            currentPlayerId={currentPlayerId} 
            onClick={handleTileClick} 
            isMismatch={mismatchedIds.includes(tile.id)}
            index={index}
          />
        ))}
      </div>

      {/* Particle Overlay */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ x: particle.x, y: particle.y, scale: 1, opacity: 1 }}
            animate={{ 
              x: particle.x + (Math.random() - 0.5) * 200, 
              y: particle.y + (Math.random() - 0.5) * 200, 
              scale: 0, 
              opacity: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-2 h-2 rounded-full z-[60] will-change-transform"
            style={{ backgroundColor: particle.color }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

Board.displayName = 'Board';
