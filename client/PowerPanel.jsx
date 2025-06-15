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
    <div>
      <h3>Use Power: {powerPrompt.power}</h3>
      {powerPrompt.players.map((p) => (
        <button key={p.id} onClick={() => act(p.id)}>
          {powerPrompt.power === 'INVESTIGATE' ? `Investigate ${p.name}` : `Select ${p.name}`}
        </button>
      ))}
    </div>
  );
}
