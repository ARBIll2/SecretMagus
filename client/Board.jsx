import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';

/**
 * Displays the current board state: enacted policies and election tracker.
 */
export default function Board() {
  const { gameState } = useContext(GameStateContext);
  const game = gameState.game || {};
  const liberal = game.enactedPolicies?.liberal || 0;
  const fascist = game.enactedPolicies?.fascist || 0;
  const tracker = game.failedElections || 0;
  const president = game.players?.[game.presidentIndex];
  const chancellor =
    game.chancellorIndex != null ? game.players?.[game.chancellorIndex] : null;

  return (
    <div>
      <h3>Board</h3>
      <p>Liberal Policies: {liberal} / 5</p>
      <p>Fascist Policies: {fascist} / 6</p>
      <p>Election Tracker: {tracker} / 3</p>
      {president && <p>President: {president.name}</p>}
      {chancellor && <p>Chancellor: {chancellor.name}</p>}
    </div>
  );
}
