/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { ScoreSnapshot, Player } from '../types';

interface LiveChartProps {
  /** History of scores over time */
  scoreHistory: ScoreSnapshot[];
  /** List of players to map scores to lines */
  players: Player[];
  /** Game start timestamp */
  startTime: number | null;
}

/**
 * Enhanced live score evolution chart using AreaChart with gradients.
 */
export const LiveChart: React.FC<LiveChartProps> = React.memo(({ scoreHistory, players, startTime }) => {
  const chartData = useMemo(() => {
    if (!startTime) return [];
    
    return scoreHistory.map(snapshot => {
      const elapsedSeconds = Math.floor((snapshot.timestamp - startTime) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return {
        time: timeStr,
        ...snapshot.scores
      };
    });
  }, [scoreHistory, startTime]);

  const playerColors = ['#00d4ff', '#22c55e', '#ffd700', '#ef4444', '#bf00ff'];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-jade-900/30 rounded-2xl p-6 h-[280px] shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black text-jade-500 uppercase tracking-[0.3em]">Score Performance</h3>
        <div className="flex gap-2">
           <div className="w-2 h-2 rounded-full bg-jade-500 animate-pulse" />
           <span className="text-[10px] text-jade-600 font-bold uppercase">Live Telemetry</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {players.map((player, index) => (
              <linearGradient key={`grad-${player.id}`} id={`color-${player.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={playerColors[index % playerColors.length]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={playerColors[index % playerColors.length]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#14532d" vertical={false} opacity={0.2} />
          <XAxis 
            dataKey="time" 
            stroke="#15803d" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#15803d" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(5, 46, 22, 0.9)', 
              border: '1px solid #15803d', 
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ fontSize: '12px', fontWeight: 'black' }}
            labelStyle={{ color: '#4ade80', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="diamond"
            wrapperStyle={{ fontSize: '10px', paddingBottom: '20px', fontWeight: 'bold', color: '#15803d' }}
          />
          {players.map((player, index) => (
            <Area
              key={player.id}
              type="monotone"
              dataKey={player.id}
              name={player.name}
              stroke={playerColors[index % playerColors.length]}
              fillOpacity={1}
              fill={`url(#color-${player.id})`}
              strokeWidth={3}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

LiveChart.displayName = 'LiveChart';
