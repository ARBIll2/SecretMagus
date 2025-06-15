import { useState, useEffect } from 'react';
import { PHASES as GAME_PHASES } from '../shared/constants.js';

/**
 * Simple state machine for the top-level app phases.
 * States: 'LOBBY' -> 'GAME' -> 'GAME_OVER'.
 * Transitions occur when the server updates the game state.
 */
export const APP_PHASES = Object.freeze({
  LOBBY: 'LOBBY',
  GAME: 'GAME',
  GAME_OVER: 'GAME_OVER',
});

export default function usePhaseMachine(gameState) {
  const [phase, setPhase] = useState(APP_PHASES.LOBBY);

  useEffect(() => {
    if (gameState?.game?.phase === GAME_PHASES.GAME_OVER || gameState?.gameOver) {
      setPhase(APP_PHASES.GAME_OVER);
    } else if (gameState?.game) {
      setPhase(APP_PHASES.GAME);
    } else {
      setPhase(APP_PHASES.LOBBY);
    }
  }, [gameState]);

  const reset = () => setPhase(APP_PHASES.LOBBY);

  return { phase, reset };
}
