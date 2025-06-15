import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
import { MESSAGE_TYPES } from '../shared/messages.js';
import { PHASES } from '../shared/constants.js';

/**
 * Allows the President to nominate a Chancellor during the NOMINATE phase.
 */
export default function NominationPanel() {
  const { socket, gameState, playerId } = useContext(GameStateContext);
  const game = gameState.game;
  if (!game || game.phase !== PHASES.NOMINATE) return null;

  const president = game.players[game.presidentIndex];

  const nominate = (nomineeId) => {
    if (socket && gameState.code) {
      socket.emit(MESSAGE_TYPES.NOMINATE_CHANCELLOR, {
        roomCode: gameState.code,
        nomineeId,
      });
    }
  };

  if (president.id !== playerId) {
    return <p>Waiting for president to nominate a chancellor...</p>;
  }

  return (
    <div>
      <h3>Nominate Chancellor</h3>
      {game.players
        .filter((p) => p.alive && p.id !== playerId)
        .map((p) => (
          <button key={p.id} onClick={() => nominate(p.id)}>
            {p.name}
          </button>
        ))}
    </div>
  );
}
