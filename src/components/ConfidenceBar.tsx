/**
 * @module ConfidenceBar
 * @description Visual confidence meter showing aggregate and per-step confidence.
 */

import React from 'react';

export interface ConfidenceBarProps {
  /** Confidence score (0-100) */
  score: number;
  /** Label to display */
  label?: string;
}

/**
 * ConfidenceBar renders a visual confidence meter.
 */
export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ score, label }) => {
  const color = score >= 85 ? '#22c55e' : score >= 65 ? '#eab308' : score >= 45 ? '#f97316' : '#ef4444';

  return (
    <div className="confidence-bar">
      {label && <span className="label">{label}</span>}
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="score">{score}%</span>
    </div>
  );
};
