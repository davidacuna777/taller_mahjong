/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ConnectionStatusProps {
  /** Whether the client is currently connected to the game server */
  isConnected: boolean;
}

/**
 * Status indicator for the multiplayer connection.
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex justify-end">
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-tighter uppercase
        ${isConnected ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}
      `}>
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`} />
        {isConnected ? 'Multiplayer Live' : 'Reconnecting...'}
      </div>
    </div>
  );
};
