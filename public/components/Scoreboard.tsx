/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal } from 'lucide-react';
import { Player } from '../types';

interface ScoreboardProps {
  /** List of all players in the game */
  players: Player[];
  /** ID of the current local player */
  currentPlayerId: string;
}

/**
 * Animated counter component for score increments.
 */
const AnimatedScore: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      const start = prevValue.current;
      const end = value;
      const duration = 600;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          prevValue.current = value;
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

/**
 * Scoreboard component showing ranked players with animations.
 */
export const Scoreboard: React.FC<ScoreboardProps> = React.memo(({ players, currentPlayerId }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          Live Standings
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full font-mono">
          {players.length} PLAYERS
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {sortedPlayers.map((player, index) => {
            const isMe = player.id === currentPlayerId;
            const rank = index + 1;

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all
                  ${isMe ? 'bg-blue-500/10 border-l-4 border-blue-500' : 'bg-slate-800/30 border-l-4 border-transparent'}
                  hover:bg-slate-800/50
                `}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {rank === 1 ? <Trophy size={18} className="text-yellow-500" /> :
                   rank === 2 ? <Medal size={18} className="text-slate-400" /> :
                   rank === 3 ? <Medal size={18} className="text-amber-700" /> :
                   <span className="text-slate-500">{rank}</span>}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold truncate ${isMe ? 'text-blue-400' : 'text-white'}`}>
                      {player.name}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${player.isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-black text-white font-mono">
                    <AnimatedScore value={player.score} />
                  </div>
                </div>

                {isMe && (
                  <motion.div 
                    layoutId="me-indicator"
                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});

Scoreboard.displayName = 'Scoreboard';
