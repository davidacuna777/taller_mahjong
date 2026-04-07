/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Dog, 
  Cat, 
  Bird, 
  Rabbit, 
  Fish, 
  Turtle, 
  Snail, 
  Bug,
  Mouse,
  PawPrint
} from 'lucide-react';

interface LobbyProps {
  /** Callback when the player joins the game */
  onJoin: (name: string, avatar: string) => void;
  /** Number of players currently connected */
  connectedCount: number;
}

const AVATARS = [
  { id: 'animal-1', icon: Dog, color: 'text-orange-400', label: 'DOG' },
  { id: 'animal-2', icon: Cat, color: 'text-blue-400', label: 'CAT' },
  { id: 'animal-3', icon: Bird, color: 'text-jade-400', label: 'BIRD' },
  { id: 'animal-4', icon: Rabbit, color: 'text-pink-400', label: 'RABBIT' },
  { id: 'animal-5', icon: Fish, color: 'text-cyan-400', label: 'FISH' },
  { id: 'animal-6', icon: Turtle, color: 'text-green-500', label: 'TURTLE' },
  { id: 'animal-7', icon: Snail, color: 'text-yellow-500', label: 'SNAIL' },
  { id: 'animal-8', icon: Bug, color: 'text-red-400', label: 'BUG' },
  { id: 'animal-9', icon: Mouse, color: 'text-slate-400', label: 'MOUSE' },
  { id: 'animal-10', icon: PawPrint, color: 'text-purple-500', label: 'PAW' },
];

/**
 * Enhanced Lobby component with FIFA-style avatar selection and animated background.
 */
export const Lobby: React.FC<LobbyProps> = ({ onJoin, connectedCount }) => {
  const [name, setName] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);

  const nextAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % AVATARS.length);
  };

  const prevAvatar = () => {
    setAvatarIndex((prev) => (prev - 1 + AVATARS.length) % AVATARS.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.length <= 16) {
      onJoin(name.trim(), AVATARS[avatarIndex].id);
    }
  };

  const currentAvatar = AVATARS[avatarIndex];
  const AvatarIcon = currentAvatar.icon;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(22,163,74,0.1),_transparent_70%)]" />
        <div className="grid-bg absolute inset-0 opacity-20" />
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.3
            }}
            animate={{ 
              x: [null, Math.random() * window.innerWidth],
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: Math.random() * 20 + 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute bg-jade-500/20 rounded-full blur-xl"
            style={{
              width: `${Math.random() * 300 + 50}px`,
              height: `${Math.random() * 300 + 50}px`,
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-2xl border border-jade-900/30 rounded-[2rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-jade-600/20 rounded-2xl border border-jade-500/30 mb-6 shadow-[0_0_30px_rgba(22,163,74,0.2)]">
            <Terminal className="text-jade-400 w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-jade-400 via-jade-200 to-neon-blue mb-4">
            MAHJONG CYBER
          </h1>
          <p className="text-jade-700 font-black uppercase tracking-[0.4em] text-xs">
            Establishing Secure Connection...
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-jade-600 uppercase tracking-[0.3em] mb-6 text-center">
              Select Your Avatar
            </label>
            
            <div className="flex items-center justify-center gap-8 max-w-lg mx-auto">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevAvatar}
                className="p-4 rounded-full bg-slate-950/80 border border-jade-500/30 text-jade-400 hover:bg-jade-500/20 hover:border-jade-400 transition-all shadow-[0_0_15px_rgba(22,163,74,0.1)]"
              >
                <ChevronLeft size={32} />
              </motion.button>

              <div className="relative w-48 h-64 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAvatar.id}
                    initial={{ opacity: 0, x: 50, rotateY: 45, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, rotateY: -45, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-jade-500/40 rounded-[2rem] p-6 flex flex-col items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                  >
                    {/* FIFA Card Style Accents */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-jade-500 to-transparent opacity-50" />
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-jade-500/10 rounded-full blur-2xl" />
                    
                    <div className="w-full flex justify-between items-start">
                       <div className="flex flex-col items-center">
                          <span className="text-xl font-black text-jade-400">99</span>
                          <span className="text-[8px] font-bold text-jade-700">OVR</span>
                       </div>
                       <div className="w-px h-8 bg-jade-900/30" />
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-jade-600">NODE</span>
                          <span className="text-[10px] font-bold text-jade-400">#{avatarIndex + 1}</span>
                       </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 bg-jade-500/20 blur-3xl rounded-full scale-150 opacity-50" />
                      <AvatarIcon className={`${currentAvatar.color} w-20 h-20 relative z-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                    </div>

                    <div className="w-full text-center space-y-1">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-jade-900/50 to-transparent" />
                      <span className="block text-lg font-black uppercase tracking-[0.2em] text-jade-100">
                        {currentAvatar.label}
                      </span>
                      <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-1 h-1 rounded-full ${i < 4 ? 'bg-jade-500' : 'bg-jade-900'}`} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextAvatar}
                className="p-4 rounded-full bg-slate-950/80 border border-jade-500/30 text-jade-400 hover:bg-jade-500/20 hover:border-jade-400 transition-all shadow-[0_0_15px_rgba(22,163,74,0.1)]"
              >
                <ChevronRight size={32} />
              </motion.button>
            </div>
          </div>

          <div className="relative group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ENTER OPERATOR NAME"
              className="w-full bg-slate-950/60 border-2 border-jade-900/30 rounded-2xl px-6 py-5 text-jade-100 placeholder:text-jade-900/50 focus:outline-none focus:border-jade-500/50 transition-all text-center font-black tracking-widest uppercase"
              maxLength={16}
              required
            />
            <div className="absolute inset-0 rounded-2xl bg-jade-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>

          <button
            type="submit"
            className="w-full bg-jade-600 hover:bg-jade-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(22,163,74,0.3)] hover:shadow-[0_0_40px_rgba(22,163,74,0.5)] active:scale-[0.98] uppercase tracking-[0.3em]"
          >
            Initialize Session
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-jade-700">
            <Users size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {connectedCount} Nodes Active
            </span>
          </div>
          <div className="w-px h-4 bg-jade-900/30" />
          <span className="text-[10px] font-black text-jade-700 uppercase tracking-widest">
            v2.0.4-STABLE
          </span>
        </div>
      </motion.div>

      <style>{`
        .grid-bg {
          background-image: linear-gradient(to right, rgba(22,163,74,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(22,163,74,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};
