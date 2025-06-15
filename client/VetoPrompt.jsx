import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
import { MESSAGE_TYPES } from '../shared/messages.js';

/**
 * President decision UI for veto requests.
 */
export default function VetoPrompt() {
  const { socket, gameState, vetoPrompt } = useContext(GameStateContext);
  if (!vetoPrompt) return null;

  const decide = (accept) => {
    if (socket && gameState.code) {
      socket.emit(MESSAGE_TYPES.VETO_DECISION, { roomCode: gameState.code, accept });
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 text-center">
      <h3 className="text-lg font-bold mb-2">Approve Veto?</h3>
      <div className="space-x-2">
        <button
          onClick={() => decide(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        >
          Yes
        </button>
        <button
          onClick={() => decide(false)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          No
        </button>
      </div>
    </div>
  );
}
