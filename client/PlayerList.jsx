import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';

function roleVariant(role) {
  if (role === 'FASCIST') return 'fascist';
  if (role === 'HITLER') return 'hitler';
  return 'neutral';
}

const FALLBACK_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAiUlEQVR4nO3OMQ0EIRRFUWYLNAwGUECJBJKxgCssTE2JAhoQgAFsTLEOhiU/2dwj4L2rFAAAAAAAAAAAf8R7X2ttrYUQpFte6b1ba40xYwzplldijEoprfWcU7plgXMu57xv/7Nv+uu6rpTS7peN7vs+jkO6YsF5ntIJa0op0gkAAAAAAAAAfu4B2AcZy2t1/7sAAAAASUVORK5CYII=';

function getPortraitForViewer(player, viewerId) {
  if (!player.portrait) return null;
  const variant =
    player.id === viewerId || player.isRevealedTo.includes(viewerId)
      ? roleVariant(player.role)
      : 'neutral';
  return `/assets/portraits/${player.portrait}_${variant}.png`;
}

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
          const src = getPortraitForViewer(p, playerId);
          return (
            <li key={p.id} className={`flex items-center ${deadStyles}`}>
              <img
                src={src || FALLBACK_SRC}
                alt=""
                className="w-8 h-8 mr-2"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_SRC;
                }}
              />
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
