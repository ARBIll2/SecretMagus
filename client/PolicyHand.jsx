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
    <div>
      <h3>Select Policy</h3>
      {policyPrompt.policies.map((p, idx) => (
        <button key={idx} onClick={() => choosePolicy(p)}>
          {p}
        </button>
      ))}
      {policyPrompt.canVeto && (
        <button onClick={requestVeto}>Request Veto</button>
      )}
    </div>
  );
}
