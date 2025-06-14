import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
import { MESSAGE_TYPES } from '../shared/messages.js';
import { PHASES } from '../shared/constants.js';

/**
 * Main game UI. Renders based on current game state from context.
 * TODO: Add nomination, voting, policy selection, and powers UI.
 */
export default function Game() {
  const { socket, gameState, role, policyPrompt, powerPrompt, powerResult, playerId } = useContext(GameStateContext);

  const roomCode = gameState?.code || gameState?.roomCode;

  const castVote = (vote) => {
    if (socket && roomCode) {
      socket.emit(MESSAGE_TYPES.CAST_VOTE, { roomCode, vote });
    }
  };

  const choosePolicy = (policy) => {
    if (socket && roomCode) {
      socket.emit(MESSAGE_TYPES.POLICY_CHOICE, { roomCode, policy });
    }
  };

  const nominate = (nomineeId) => {
    if (socket && roomCode) {
      socket.emit(MESSAGE_TYPES.NOMINATE_CHANCELLOR, { roomCode, nomineeId });
    }
  };

  const usePower = (targetId) => {
    if (socket && roomCode) {
      socket.emit(MESSAGE_TYPES.USE_POWER, { roomCode, action: { targetId } });
    }
  };

  return (
    <div>
      <h2>Game In Progress</h2>
      {gameState.gameOver && (
        <div>
          <h3>Game Over</h3>
          <p>Winner: {gameState.gameOver.winner}</p>
          <p>Reason: {gameState.gameOver.reason}</p>
        </div>
      )}
      {role && <p>Your role: {role}</p>}

      {!gameState.gameOver && gameState?.game?.phase === PHASES.NOMINATE && (
        playerId === gameState.game.players[gameState.game.presidentIndex]?.id ? (
          <div>
            <h3>Nominate Chancellor</h3>
            {gameState.game.players
              .filter((p) => p.alive && p.id !== playerId)
              .map((p) => (
                <button key={p.id} onClick={() => nominate(p.id)}>
                  {p.name}
                </button>
              ))}
          </div>
        ) : (
          <p>Waiting for president to nominate a chancellor...</p>
        )
      )}

      {!gameState.gameOver && gameState?.game?.phase === PHASES.VOTE && (
        <div>
          <h3>Cast Your Vote</h3>
          <button onClick={() => castVote(true)}>Ja!</button>
          <button onClick={() => castVote(false)}>Nein!</button>
        </div>
      )}

      {policyPrompt && !gameState.gameOver && (
        <div>
          <h3>Select Policy</h3>
          {policyPrompt.map((p, idx) => (
            <button key={idx} onClick={() => choosePolicy(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      {powerPrompt && !gameState.gameOver && (
        <div>
          <h3>Use Power: {powerPrompt.power}</h3>
          {powerPrompt.players.map((p) => (
            <button key={p.id} onClick={() => usePower(p.id)}>
              {powerPrompt.power === 'INVESTIGATE'
                ? `Investigate ${p.name}`
                : `Select ${p.name}`}
            </button>
          ))}
        </div>
      )}

      {powerResult && powerResult.power === 'INVESTIGATE' && (
        <div>
          <p>
            Investigation Result: {powerResult.membership} for player {powerResult.targetId}
          </p>
        </div>
      )}
      {powerResult && powerResult.power === 'SPECIAL_ELECTION' && (
        <div>
          <p>Special Election: {powerResult.targetId} will be the next President.</p>
        </div>
      )}

      <pre>{JSON.stringify(gameState, null, 2)}</pre>
      {/* TODO: replace with proper components for each game phase */}
    </div>
  );
}
