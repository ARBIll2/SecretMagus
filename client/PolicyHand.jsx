import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
import { MESSAGE_TYPES } from '../shared/messages.js';

/**
 * Presents the current player's policy choices.
 */
export default function PolicyHand() {
  const { socket, gameState, policyPrompt } = useContext(GameStateContext);
  if (!policyPrompt || gameState.game?.phase !== 'POLICY') return null;

  const choosePolicy = (policy) => {
    if (socket && gameState.code) {
      socket.emit(MESSAGE_TYPES.POLICY_CHOICE, { roomCode: gameState.code, policy });
    }
  };

  const requestVeto = () => {
    if (socket && gameState.code) {
      socket.emit(MESSAGE_TYPES.POLICY_CHOICE, { roomCode: gameState.code, veto: true });
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-bold mb-2">Select Policy</h3>
      <div className="flex flex-wrap gap-2 mb-2">
        {policyPrompt.policies.map((p, idx) => (
          <button
            key={idx}
            onClick={() => choosePolicy(p)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            {p}
          </button>
        ))}
      </div>
      {policyPrompt.canVeto && (
        <button
          onClick={requestVeto}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Request Veto
        </button>
      )}
    </div>
  );
}
