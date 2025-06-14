import React, { useState } from 'react';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';
import GameStateProvider from './GameStateContext.js';

/**
 * Root component. Switches between Lobby and Game views.
 * TODO: Add proper routing or state machine to manage phases.
 */
export default function App() {
  const [inGame, setInGame] = useState(false); // replace with real state logic

  return (
    <GameStateProvider>
      {inGame ? <Game /> : <Lobby onStart={() => setInGame(true)} />}
    </GameStateProvider>
  );
}
