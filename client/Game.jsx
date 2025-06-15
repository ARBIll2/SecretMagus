import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
import Board from './Board.jsx';
import PlayerList from './PlayerList.jsx';
import ActionLog from './ActionLog.jsx';
import Tips from './Tips.jsx';
import NominationPanel from './NominationPanel.jsx';
import VotePanel from './VotePanel.jsx';
import PolicyHand from './PolicyHand.jsx';
import VetoPrompt from './VetoPrompt.jsx';
import PowerPanel from './PowerPanel.jsx';

/**
 * Main game UI. Renders based on current game state from context.
 */
export default function Game() {
  const {
    gameState,
    role,
    roleInfo,
    policyPrompt,
    powerPrompt,
    powerResult,
    playerId,
    vetoPrompt,
    nomination,
    leaveRoom,
  } = useContext(GameStateContext);

  const me = gameState?.game?.players?.find((p) => p.id === playerId);

  const roomCode = gameState?.code || gameState?.roomCode;

  const exitRoom = () => {
    if (gameState?.code) {
      leaveRoom(gameState.code);
    }
  };


  return (
    <div>
      <h2>Game In Progress</h2>
      <button onClick={exitRoom}>Leave Room</button>
      <Board />
      <PlayerList />
      {gameState.gameOver && (
        <div>
          <h3>Game Over</h3>
          <p>Winner: {gameState.gameOver.winner}</p>
          <p>Reason: {gameState.gameOver.reason}</p>
        </div>
      )}
      {role && <p>Your role: {role}</p>}
      {roleInfo && roleInfo.fascists && roleInfo.fascists.length > 0 && (
        <div>
          <p>Known Fascists:</p>
          <ul>
            {roleInfo.fascists.map((f) => (
              <li key={f.id}>{f.name}</li>
            ))}
          </ul>
        </div>
      )}
      {roleInfo && roleInfo.hitler && (
        <p>Hitler is {roleInfo.hitler.name}</p>
      )}

      {me && !me.alive && <p>You have been executed and may not act.</p>}

      {nomination && (
        <p>
          {
            gameState.game.players.find((p) => p.id === nomination.presidentId)
              ?.name
          }{' '}
          nominated{' '}
          {
            gameState.game.players.find((p) => p.id === nomination.nomineeId)
              ?.name
          }
          {' '}as Chancellor.
        </p>
      )}

      {!gameState.gameOver && <NominationPanel />}
      {!gameState.gameOver && <VotePanel />}
      {policyPrompt && !gameState.gameOver && <PolicyHand />}
      {vetoPrompt && !gameState.gameOver && <VetoPrompt />}
      {powerPrompt && !gameState.gameOver && <PowerPanel />}

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
      {powerResult && powerResult.power === 'POLICY_PEEK' && (
        <div>
          <p>Top Policies: {powerResult.policies.join(', ')}</p>
        </div>
      )}
      {powerResult && powerResult.power === 'EXECUTION' && (
        <div>
          <p>{powerResult.targetName} has been executed.</p>
          {powerResult.gameOver && (
            <p>Game Over - {powerResult.gameOver.winner} win: {powerResult.gameOver.reason}</p>
          )}
        </div>
      )}

      {gameState.lastVote && (
        <div>
          <h3>Vote Result: {gameState.lastVote.passed ? 'Government elected' : 'Rejected'}</h3>
          <ul>
            {gameState.lastVote.votes.map((v) => {
              const name = gameState.game.players.find((p) => p.id === v.id)?.name || v.id;
              return (
                <li key={v.id}>
                  {name}: {v.vote ? 'Ja' : 'Nein'}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Tips />
      <ActionLog />

      <pre>{JSON.stringify(gameState, null, 2)}</pre>
    </div>
  );
}
