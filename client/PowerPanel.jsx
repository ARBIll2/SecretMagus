import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
import { MESSAGE_TYPES } from '../shared/messages.js';

/**
 * Renders presidential powers when available.
 */
export default function PowerPanel() {
  const { socket, gameState, powerPrompt } = useContext(GameStateContext);
  if (!powerPrompt || gameState.game?.phase !== 'POWER') return null;

  const act = (targetId) => {
    if (socket && gameState.code) {
      socket.emit(MESSAGE_TYPES.USE_POWER, {
        roomCode: gameState.code,
        action: { targetId },
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-bold mb-2">Use Power: {powerPrompt.power}</h3>
      <div className="flex flex-wrap gap-2">
        {powerPrompt.players.map((p) => (
          <button
            key={p.id}
            onClick={() => act(p.id)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            {powerPrompt.power === 'INVESTIGATE'
              ? `Investigate ${p.name}`
              : `Select ${p.name}`}
          </button>
        ))}
      </div>
    </div>
  );
}
