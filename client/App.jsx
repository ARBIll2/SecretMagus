import React, { useContext } from 'react';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';
import GameStateProvider, { GameStateContext } from './GameStateContext.js';

/**
 * Root component. Switches between Lobby and Game views.
 * TODO: Add proper routing or state machine to manage phases.
 */
function AppContent() {
  const { gameState } = useContext(GameStateContext);
  const inGame = !!gameState?.game;
  return inGame ? <Game /> : <Lobby />;
}

export default function App() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}
