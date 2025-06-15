import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
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
    <div>
      <h3>Approve Veto?</h3>
      <button onClick={() => decide(true)}>Yes</button>
      <button onClick={() => decide(false)}>No</button>
    </div>
  );
}
