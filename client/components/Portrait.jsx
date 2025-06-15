import React, { useState } from 'react';

export default function Portrait({ portraitId, variant = 'neutral' }) {
  const [error, setError] = useState(false);
  if (!portraitId) return null;
  const src = `/assets/portraits/${portraitId}_${variant}.png`;

  if (error) {
    return (
      <div className="portrait-fallback">
        <span>?</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={portraitId}
      onError={() => setError(true)}
      className="w-20 h-20 object-cover"
    />
  );
}
