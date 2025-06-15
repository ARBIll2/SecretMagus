import React, { useContext } from 'react';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';
import GameStateProvider, { GameStateContext } from './GameStateContext.jsx';
import usePhaseMachine, { APP_PHASES } from './usePhaseMachine.js';

/**
 * Root component. Switches between Lobby and Game views using a small phase
 * state machine. This avoids ad-hoc checks scattered across components.
 */
function AppContent() {
  const { gameState } = useContext(GameStateContext);
  const { phase } = usePhaseMachine(gameState);

  switch (phase) {
    case APP_PHASES.GAME:
      return <Game />;
    case APP_PHASES.GAME_OVER:
      return <Game />;
    default:
      return <Lobby />;
  }
}

export default function App() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}
