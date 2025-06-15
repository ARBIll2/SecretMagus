import React, { useContext, useState } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
import { PHASES } from '../shared/constants.js';
import Board from './Board.jsx';
import PlayerList from './PlayerList.jsx';
import ActionLog from './ActionLog.jsx';
import Tips from './Tips.jsx';
import NominationPanel from './NominationPanel.jsx';
import VotePanel from './VotePanel.jsx';
import PolicyHand from './PolicyHand.jsx';
import VetoPrompt from './VetoPrompt.jsx';
import PowerPanel from './PowerPanel.jsx';
import ExecutedOverlay from './ExecutedOverlay.jsx';
import GameOverScreen from './GameOverScreen.jsx';
import ChatBox from './ChatBox.jsx';

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

  const [showDebug, setShowDebug] = useState(false);

  const me = gameState?.game?.players?.find((p) => p.id === playerId);

  const roomCode = gameState?.code || gameState?.roomCode;

  const exitRoom = () => {
    if (
      gameState?.game &&
      gameState.game.phase !== PHASES.GAME_OVER &&
      !window.confirm(
        'Leaving will mark you as executed and may end the game. Are you sure?'
      )
    ) {
      return;
    }
    if (gameState?.code) {
      leaveRoom(gameState.code);
    }
  };


  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Room {roomCode}</h2>
        <div>
          <button
            onClick={() => setShowDebug((d) => !d)}
            className="bg-gray-600 text-white px-3 py-1 rounded mr-2"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
          <button
            onClick={exitRoom}
            className="bg-gray-800 text-white px-3 py-1 rounded"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Board />
        <PlayerList />
      </div>

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

      {me && !me.alive && !gameState.gameOver && <ExecutedOverlay />}

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

      {!gameState.gameOver && (
        <div className="space-y-4">
          <NominationPanel />
          <VotePanel />
          {policyPrompt && <PolicyHand />}
          {vetoPrompt && <VetoPrompt />}
          {powerPrompt && <PowerPanel />}
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
      {powerResult && powerResult.power === 'POLICY_PEEK' && (
        <div>
          <p>Top Policies: {powerResult.policies.join(', ')}</p>
        </div>
      )}
      {powerResult && powerResult.power === 'EXECUTION' && (
        <div>
          <p>{powerResult.targetName} has been executed.</p>
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

      <div className="grid md:grid-cols-2 gap-4">
        <Tips />
        <ActionLog />
      </div>

      <ChatBox />

      {gameState.gameOver && <GameOverScreen />}

      {showDebug && (
        <pre className="bg-gray-100 p-2 overflow-auto mt-2">
          {JSON.stringify(gameState, null, 2)}
        </pre>
      )}
    </div>
  );
}
