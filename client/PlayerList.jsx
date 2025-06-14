import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';

/**
 * Displays the list of players in seating order with indicators
 * for the current President and Chancellor. Executed players are
 * shown but marked as dead.
 */
export default function PlayerList() {
  const { gameState } = useContext(GameStateContext);
  const game = gameState.game;
  if (!game) return null;

  return (
    <div>
      <h3>Players</h3>
      <ol>
        {game.players.map((p, idx) => {
          const isPresident = idx === game.presidentIndex;
          const isChancellor = idx === game.chancellorIndex;
          return (
            <li key={p.id}>
              {p.name}
              {!p.alive && ' (dead)'}
              {isPresident && ' - President'}
              {isChancellor && ' - Chancellor'}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
