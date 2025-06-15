import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
import { getTipsForPlayer } from '../shared/tips.js';

/**
 * Renders AI-generated suggestions for the current player.
 */
export default function Tips() {
  const { gameState, playerId, role } = useContext(GameStateContext);
  const game = gameState.game;
  const tips = getTipsForPlayer(game, playerId, role);

  if (!tips.length) return null;

  return (
    <div>
      <h3>Tips</h3>
      <ul>
        {tips.map((t, idx) => (
          <li key={idx}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
