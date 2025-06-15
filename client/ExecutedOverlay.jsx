import React from 'react';

/**
 * Overlay shown to players that have been executed.
 * Provides a persistent reminder they may only observe.
 */
export default function ExecutedOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white pointer-events-none z-40">
      <div className="bg-red-900 p-4 rounded shadow-lg">
        <p>You have been executed and may not act.</p>
      </div>
    </div>
  );
}
