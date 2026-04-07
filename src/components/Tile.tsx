/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Zap, Flame, Snowflake, Ghost as GhostIcon } from 'lucide-react';
import { Tile as TileType, PowerUpType } from '../types';
import { soundService } from '../services/SoundService';

interface TileProps {
  /** The tile data object */
  tile: TileType;
  /** ID of the current local player */
  currentPlayerId: string;
  /** Callback when the tile is clicked */
  onClick: (id: string) => void;
  /** Whether this tile was part of a recent mismatch */
  isMismatch?: boolean;
  /** Index for staggered entrance animation */
  index?: number;
}

const PowerUpIcon: React.FC<{ type: PowerUpType }> = ({ type }) => {
  switch (type) {
    case 'STRIKE': return <Zap size={12} className="text-yellow-400 strike-effect" />;
    case 'FIRE': return <Flame size={12} className="text-orange-500 fire-effect" />;
    case 'ICE': return <Snowflake size={12} className="text-blue-300 ice-effect" />;
    case 'GHOST': return <GhostIcon size={12} className="text-purple-400 ghost-effect" />;
    default: return null;
  }
};

/**
 * Individual Mahjong Tile component with CSS flip and Framer Motion feedback.
 * Optimized for performance and smaller layout.
 */
export const Tile: React.FC<TileProps> = React.memo(({ tile, currentPlayerId, onClick, isMismatch, index = 0 }) => {
  const isLockedByMe = tile.lockedBy === currentPlayerId;
  const isLockedByOthers = tile.lockedBy !== null && !isLockedByMe;
  // Las cartas deben mostrarse volteadas si están isFlipped O si están matched
  const isFlipped = tile.isFlipped || tile.isMatched;
  
  useEffect(() => {
    if (tile.isFlipped && !tile.isMatched) {
      soundService.play('FLIP');
    }
    if (tile.isMatched) {
      soundService.play('MATCH');
    }
  }, [tile.isFlipped, tile.isMatched]);

  useEffect(() => {
    if (isMismatch) {
      soundService.play('MISMATCH');
    }
  }, [isMismatch]);

  const handleClick = () => {
    // No permitir clicks en cartas matched o locked por otros jugadores
    if (tile.isMatched || isLockedByOthers) {
      return;
    }
    onClick(tile.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={isMismatch ? {
        x: [0, -10, 10, -10, 10, 0],
        rotate: [0, -5, 5, -5, 5, 0],
        opacity: 1,
        scale: 1
      } : { 
        opacity: 1, 
        scale: 1, 
        rotate: 0,
        x: 0
      }}
      transition={isMismatch ? {
        duration: 0.4,
        ease: "easeInOut"
      } : { 
        delay: index * 0.005,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      whileHover={!isFlipped && !isLockedByOthers ? { 
        scale: 1.05, 
        y: -4,
        rotate: 1,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={!tile.isMatched && !isLockedByOthers ? { scale: 0.9 } : {}}
      className={`relative aspect-[3/4] cursor-pointer group select-none ${isMismatch ? 'z-20' : ''}`}
      onClick={handleClick}
      style={{ perspective: '1000px' }}
    >
      <div className={`tile-inner ${isFlipped ? 'flipped' : ''} ${isLockedByMe ? 'glow-blue' : ''}`}>
        {/* Front (Face Down) */}
        <div className="tile-front bg-slate-900 border border-jade-800 rounded-md shadow-lg flex items-center justify-center overflow-hidden">
          <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-jade-500" />
          <div className="w-6 h-6 border-2 border-jade-700/30 rounded-lg rotate-45 flex items-center justify-center">
             <div className="w-2 h-2 bg-jade-500/20 rounded-full" />
          </div>
          
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 4px)', backgroundSize: '8px 8px' }} />
        </div>

        {/* Back (Face Up) */}
        <div 
          className={`tile-back rounded-md shadow-xl flex items-center justify-center transition-all duration-300
            ${tile.isMatched ? 'bg-jade-950 border-jade-500 opacity-30 scale-95' : 'bg-white border-slate-200'}
            ${isLockedByMe ? 'ring-2 ring-neon-blue ring-offset-1 ring-offset-slate-950' : ''}
            ${isLockedByOthers ? 'ring-2 ring-amber-500/50 opacity-60 grayscale-[0.3]' : ''}
            ${isMismatch ? 'border-red-500 ring-2 ring-red-500/50' : 'border'}
          `}
        >
          <span className={`text-3xl md:text-4xl lg:text-5xl leading-none font-black ${tile.isMatched ? 'text-jade-400' : 'text-slate-900'}`}>
            {tile.symbol}
          </span>

          {/* Power-up Icon on back */}
          {tile.powerUp && !tile.isMatched && (
            <div className="absolute bottom-1 right-1 bg-slate-900/80 p-0.5 rounded-full border border-slate-700">
              <PowerUpIcon type={tile.powerUp} />
            </div>
          )}

          {tile.isMatched && (
            <motion.div 
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-jade-500/10 rounded-md"
            >
              <Check className="text-jade-400 w-6 h-6 stroke-[4px]" />
            </motion.div>
          )}

          {isLockedByOthers && (
            <motion.div 
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-amber-500/5 rounded-md"
            />
          )}
        </div>
      </div>

      {/* Selection Ripple Effect */}
      <AnimatePresence>
        {isLockedByMe && !tile.isMatched && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            className="absolute inset-0 border-2 border-neon-blue rounded-md pointer-events-none z-10 shadow-[0_0_15px_#00d4ff]"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

Tile.displayName = 'Tile';
