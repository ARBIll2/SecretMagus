import React, { useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';

/**
 * Displays a list of public actions taken in the game.
 */
export default function ActionLog() {
  const { gameState } = useContext(GameStateContext);
  const history = gameState.game?.history || [];

  if (history.length === 0) return null;

  const renderEntry = (entry, idx) => {
    switch (entry.type) {
      case 'NOMINATION':
        return (
          <li key={idx}>
            Nomination: {entry.president} nominated {entry.chancellor}
          </li>
        );
      case 'VOTE':
        return (
          <li key={idx}>Vote result: {entry.result ? 'passed' : 'failed'}</li>
        );
      case 'POLICY':
        return <li key={idx}>Policy enacted: {entry.policy}</li>;
      case 'EXECUTION':
        return <li key={idx}>Execution: {entry.target}</li>;
      case 'VETO':
        return (
          <li key={idx}>Veto {entry.accepted ? 'accepted' : 'rejected'}</li>
        );
      default:
        return <li key={idx}>{entry.type}</li>;
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 max-h-48 overflow-y-auto">
      <h3 className="text-lg font-bold mb-2">Action Log</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {history.map(renderEntry)}
      </ul>
    </div>
  );
}
