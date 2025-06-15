import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
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
    return (
      <p className="text-center italic mb-2">
        Waiting for president to nominate a chancellor...
      </p>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-bold mb-2">Nominate Chancellor</h3>
      <div className="flex flex-wrap gap-2">
        {game.players
          .filter((p) => p.alive && p.id !== playerId)
          .map((p) => (
            <button
              key={p.id}
              onClick={() => nominate(p.id)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              {p.name}
            </button>
          ))}
      </div>
    </div>
  );
}
