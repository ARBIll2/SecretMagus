import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
import Portrait from './components/Portrait.jsx';

/**
 * Displays the list of players in seating order with indicators
 * for the current President and Chancellor. Executed players are
 * shown but marked as dead.
 */
export default function PlayerList() {
  const { gameState, playerId } = useContext(GameStateContext);
  const game = gameState.game;
  if (!game) return null;

  return (
    <div className="player-list bg-white p-4 rounded shadow max-w-md mx-auto mb-4">
      <h3 className="text-xl font-bold mb-2">Players</h3>
      <ol className="space-y-1">
        {game.players.map((p, idx) => {
          const isPresident = idx === game.presidentIndex;
          const isChancellor = idx === game.chancellorIndex;
          const deadStyles = !p.alive ? 'line-through text-gray-500' : '';
          const revealed = p.isRevealedTo?.includes(playerId) || p.id === playerId;
          const variant = revealed
            ? p.role === 'HITLER'
              ? 'hitler'
              : p.role === 'FASCIST'
              ? 'fascist'
              : 'neutral'
            : 'neutral';
          return (
            <li key={p.id} className={`flex items-center space-x-2 ${deadStyles}`}>
              <Portrait portraitId={p.portrait} variant={variant} />
              <span className="flex-1">{p.name}</span>
              {!p.alive && (
                <span className="ml-2 text-gray-600" title="Executed">☠️</span>
              )}
              {isPresident && (
                <span className="ml-2 text-blue-600" title="President">
                  👑
                </span>
              )}
              {isChancellor && (
                <span className="ml-2 text-green-600" title="Chancellor">
                  ⭐
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
