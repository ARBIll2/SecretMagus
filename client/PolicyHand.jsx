import React, { useContext, useState } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
import { MESSAGE_TYPES } from '../shared/messages.js';

/**
 * Presents the current player's policy choices.
 */
export default function PolicyHand() {
  const { socket, gameState, policyPrompt } = useContext(GameStateContext);
  const [selectedIdx, setSelectedIdx] = useState(null);
  if (!policyPrompt || gameState.game?.phase !== 'POLICY') return null;

  const choosePolicy = (policy, idx) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    if (socket && gameState.code) {
      socket.emit(MESSAGE_TYPES.POLICY_CHOICE, { roomCode: gameState.code, policy });
    }
  };

  const requestVeto = () => {
    if (selectedIdx !== null) return;
    setSelectedIdx(-1);
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
            onClick={() => choosePolicy(p, idx)}
            disabled={selectedIdx !== null}
            className={`bg-blue-500 text-white px-3 py-1 rounded transition transform ${
              selectedIdx === idx
                ? 'opacity-50 scale-95'
                : 'hover:bg-blue-600 hover:scale-105'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      {policyPrompt.canVeto && (
        <button
          onClick={requestVeto}
          disabled={selectedIdx !== null}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Request Veto
        </button>
      )}
      {selectedIdx !== null && (
        <p className="mt-2 italic text-gray-600">Waiting for other player...</p>
      )}
    </div>
  );
}
