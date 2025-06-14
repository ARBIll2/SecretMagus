import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';

/**
 * Main game UI. Renders based on current game state from context.
 * TODO: Add nomination, voting, policy selection, and powers UI.
 */
export default function Game() {
  const { gameState } = useContext(GameStateContext);

  return (
    <div>
      <h2>Game In Progress</h2>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
      {/* TODO: replace with proper components for each game phase */}
    </div>
  );
}
