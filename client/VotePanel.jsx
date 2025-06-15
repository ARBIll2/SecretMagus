import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
import { MESSAGE_TYPES } from '../shared/messages.js';
import { PHASES } from '../shared/constants.js';

/**
 * Lets players cast their vote during the VOTE phase.
 */
export default function VotePanel() {
  const { socket, gameState, playerId } = useContext(GameStateContext);
  const game = gameState.game;
  const me = game?.players?.find((p) => p.id === playerId);

  if (!game || game.phase !== PHASES.VOTE || !me?.alive) return null;

  const castVote = (vote) => {
    if (socket && gameState.code) {
      socket.emit(MESSAGE_TYPES.CAST_VOTE, { roomCode: gameState.code, vote });
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 text-center">
      <h3 className="text-lg font-bold mb-2">Cast Your Vote</h3>
      <div className="space-x-2">
        <button
          onClick={() => castVote(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        >
          Ja!
        </button>
        <button
          onClick={() => castVote(false)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Nein!
        </button>
      </div>
    </div>
  );
}
