import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';

/**
 * Full-screen overlay shown when the game ends.
 * Displays winner, reason, and reveals all player roles.
 */
export default function GameOverScreen() {
  const { gameState, leaveRoom } = useContext(GameStateContext);
  const result = gameState.gameOver;
  const players = gameState.game?.players || [];

  if (!result) return null;

  const exit = () => {
    if (gameState.code) {
      leaveRoom(gameState.code);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center text-white z-50">
      <div className="bg-gray-800 p-6 rounded shadow-lg max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Game Over</h2>
        <p className="mb-2">Winner: {result.winner}</p>
        <p className="mb-4">Reason: {result.reason}</p>
        <h3 className="text-xl font-semibold mb-2">Final Roles</h3>
        <ul className="mb-4">
          {players.map((p) => (
            <li key={p.id} className={!p.alive ? 'line-through text-gray-400' : ''}>
              {p.name} - {p.role}
            </li>
          ))}
        </ul>
        <button onClick={exit} className="bg-white text-black px-4 py-2 rounded">Exit Room</button>
      </div>
    </div>
  );
}
