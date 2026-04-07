/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Info, Flame, Zap, Shield, Target, Clock, MessageSquare, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Player, Reaction } from '../types';
import { soundService } from '../services/SoundService';
import { Board } from './Board';
import { Scoreboard } from './Scoreboard';
import { LiveChart } from './LiveChart';
import { ConnectionStatus } from './ConnectionStatus';

interface GameLayoutProps {
  /** Current state of the game */
  gameState: GameState;
  /** Elapsed time in seconds */
  elapsedTime: number;
  /** ID of the current local player */
  currentPlayerId: string;
  /** Callback when a tile is clicked */
  onTileClick: (id: string) => void;
  /** Whether the client is connected */
  isConnected: boolean;
  /** Current match streak for the local player */
  streak?: number;
  /** Callback to restart the game */
  onPlayAgain?: () => void;
  /** Callback to send a reaction */
  onSendReaction: (emoji: string) => void;
}

const REACTION_EMOJIS = ['🔥', '⚡', '🧊', '👻', '🎯', '👏', 'GG', '🤖'];

/**
 * Main layout component that organizes the game board and side panels.
 * Unique Cyber-Jade theme with the chart positioned below the board.
 */
export const GameLayout: React.FC<GameLayoutProps> = ({ 
  gameState, 
  elapsedTime,
  currentPlayerId, 
  onTileClick, 
  isConnected,
  streak = 0,
  onPlayAgain,
  onSendReaction
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);

  // Play sound when new reactions arrive
  useEffect(() => {
    if (gameState.reactions.length > 0) {
      soundService.play('REACTION');
    }
  }, [gameState.reactions.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-6 lg:p-8 font-sans selection:bg-jade-500/30 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Game Board & Chart */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex items-center justify-between px-4 py-2 bg-jade-950/20 border-b border-jade-900/30 rounded-t-2xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-jade-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(22,163,74,0.4)]">
                    <Target className="text-white" size={20} />
                 </div>
                 <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-jade-400 to-neon-blue">
                   MAHJONG CYBER LIVE
                 </h1>
              </div>
              
              {streak > 1 && (
                <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                  <Flame size={16} className="animate-pulse" fill="currentColor" />
                  <span className="text-sm font-black tracking-widest rainbow-streak">
                    {streak}x STREAK
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-jade-950/40 px-4 py-1.5 rounded-xl border border-jade-900/30">
                <Clock size={16} className="text-jade-500" />
                <span className="text-lg font-mono font-black text-jade-400 tabular-nums">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              <div className="hidden lg:block">
                <ConnectionStatus isConnected={isConnected} />
              </div>
            </div>
          </div>
          
          <Board 
            tiles={gameState.tiles} 
            currentPlayerId={currentPlayerId} 
            onTileClick={onTileClick}
            isGameOver={gameState.isGameOver}
            players={gameState.players}
            onPlayAgain={onPlayAgain}
          />
        </div>

        {/* Right Side: Panels */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="lg:hidden">
            <ConnectionStatus isConnected={isConnected} />
          </div>

          <Scoreboard 
            players={gameState.players} 
            currentPlayerId={currentPlayerId} 
          />

          <LiveChart 
            scoreHistory={gameState.scoreHistory} 
            players={gameState.players} 
            startTime={gameState.startTime} 
          />

          {/* Reactions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="w-full flex items-center justify-between bg-slate-900/40 backdrop-blur-xl border border-jade-900/20 rounded-2xl p-4 shadow-xl hover:bg-jade-900/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-neon-blue group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Transmit Reaction</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${showReactions ? 'bg-jade-500' : 'bg-jade-900'} transition-colors`} />
            </button>

            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-4 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border border-jade-900/40 rounded-2xl p-4 grid grid-cols-4 gap-3 shadow-2xl z-50"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onSendReaction(emoji);
                        setShowReactions(false);
                      }}
                      className="text-2xl p-2 hover:bg-jade-500/20 rounded-xl transition-all hover:scale-125 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Power-ups Legend */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-jade-900/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 text-neon-purple mb-4">
              <Zap size={18} />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Cyber Power-ups</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-2 bg-jade-950/20 rounded-lg border border-jade-900/20">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Strike</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-jade-950/20 rounded-lg border border-jade-900/20">
                <Flame size={14} className="text-orange-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Fire</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-jade-950/20 rounded-lg border border-jade-900/20">
                <Shield size={14} className="text-blue-300" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ice</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-jade-950/20 rounded-lg border border-jade-900/20">
                <Shield size={14} className="text-purple-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ghost</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-jade-900/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 text-jade-500 mb-4">
              <Info size={18} />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Mission Intel</h4>
            </div>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-jade-900/50 rounded flex items-center justify-center text-[10px] font-black text-jade-400 border border-jade-800">01</div>
                <p className="leading-relaxed">Synchronize <span className="text-jade-200 font-bold">matching symbols</span> to decrypt the board.</p>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-jade-900/50 rounded flex items-center justify-center text-[10px] font-black text-jade-400 border border-jade-800">02</div>
                <p className="leading-relaxed">Collect <span className="text-neon-purple font-bold">Power-up Cores</span> to gain tactical advantages.</p>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-jade-900/50 rounded flex items-center justify-center text-[10px] font-black text-jade-400 border border-jade-800">03</div>
                <p className="leading-relaxed">Maintain <span className="text-orange-500 font-bold">Streaks</span> for exponential score multipliers.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <AnimatePresence>
          {gameState.reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 0, y: 100, x: Math.random() * window.innerWidth }}
              animate={{ opacity: 1, y: -200 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="absolute text-4xl"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="bg-slate-900/80 backdrop-blur-md border border-jade-500/30 px-3 py-1 rounded-full text-xs font-black text-jade-400 uppercase tracking-widest">
                  {gameState.players.find(p => p.id === reaction.playerId)?.name}
                </div>
                {reaction.emoji}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Over Podium Overlay */}
      <AnimatePresence>
        {gameState.isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-[#020617]/90 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl bg-slate-900/40 border border-jade-500/30 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(22,163,74,0.2)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-jade-500 to-transparent" />
              
              <Trophy size={64} className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
              <h2 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-jade-400 via-jade-200 to-neon-blue mb-12">
                MISSION COMPLETE
              </h2>

              <div className="grid grid-cols-3 gap-8 items-end mb-16">
                {/* 2nd Place */}
                <div className="flex flex-col items-center gap-4">
                  <div className="text-slate-400 font-black text-sm uppercase tracking-widest">2nd Place</div>
                  <div className="w-24 h-24 bg-slate-800 rounded-2xl border-2 border-slate-500 flex items-center justify-center text-4xl shadow-xl">
                    🥈
                  </div>
                  <div className="bg-slate-800/50 w-full h-32 rounded-t-3xl border-x border-t border-slate-700 flex flex-col items-center justify-center p-4">
                    <span className="text-lg font-black text-slate-200 truncate w-full">
                      {gameState.players.sort((a, b) => b.score - a.score)[1]?.name || '---'}
                    </span>
                    <span className="text-jade-500 font-mono font-black">
                      {gameState.players.sort((a, b) => b.score - a.score)[1]?.score || 0}
                    </span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center gap-4">
                  <div className="text-yellow-400 font-black text-sm uppercase tracking-[0.3em] flex items-center gap-2">
                    <Star size={16} fill="currentColor" />
                    CHAMPION
                    <Star size={16} fill="currentColor" />
                  </div>
                  <div className="w-32 h-32 bg-jade-900/40 rounded-3xl border-4 border-yellow-400 flex items-center justify-center text-6xl shadow-[0_0_40px_rgba(250,204,21,0.3)] animate-bounce">
                    🥇
                  </div>
                  <div className="bg-jade-900/20 w-full h-48 rounded-t-3xl border-x border-t border-jade-500/50 flex flex-col items-center justify-center p-4 shadow-[0_0_30px_rgba(22,163,74,0.2)]">
                    <span className="text-2xl font-black text-jade-100 truncate w-full">
                      {gameState.players.sort((a, b) => b.score - a.score)[0]?.name || '---'}
                    </span>
                    <span className="text-3xl text-jade-400 font-mono font-black">
                      {gameState.players.sort((a, b) => b.score - a.score)[0]?.score || 0}
                    </span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center gap-4">
                  <div className="text-orange-700 font-black text-sm uppercase tracking-widest">3rd Place</div>
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl border-2 border-orange-700 flex items-center justify-center text-3xl shadow-xl">
                    🥉
                  </div>
                  <div className="bg-slate-800/50 w-full h-24 rounded-t-3xl border-x border-t border-slate-700 flex flex-col items-center justify-center p-4">
                    <span className="text-base font-black text-slate-300 truncate w-full">
                      {gameState.players.sort((a, b) => b.score - a.score)[2]?.name || '---'}
                    </span>
                    <span className="text-jade-600 font-mono font-black">
                      {gameState.players.sort((a, b) => b.score - a.score)[2]?.score || 0}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onPlayAgain}
                className="bg-jade-600 hover:bg-jade-500 text-white font-black px-12 py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(22,163,74,0.3)] hover:shadow-[0_0_40px_rgba(22,163,74,0.5)] uppercase tracking-[0.3em]"
              >
                Re-Initialize Session
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(150px) rotate(720deg); opacity: 0; }
        }
        .confetti-burst {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 1px;
          animation: confetti 1s ease-out forwards;
        }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .rainbow-streak {
          background: linear-gradient(to right, #f97316, #facc15, #f97316);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 2s linear infinite;
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};
