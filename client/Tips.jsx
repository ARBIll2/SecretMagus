import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
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
    <div className="bg-white p-4 rounded shadow mb-4 text-sm">
      <h3 className="text-lg font-bold mb-2">Tips</h3>
      <ul className="list-disc list-inside space-y-1">
        {tips.map((t, idx) => (
          <li key={idx}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
