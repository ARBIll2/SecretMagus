import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
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
    <div>
      <h3>Cast Your Vote</h3>
      <button onClick={() => castVote(true)}>Ja!</button>
      <button onClick={() => castVote(false)}>Nein!</button>
    </div>
  );
}
