/**
 * @module ReasoningView
 * @description Displays the step-by-step reasoning process with
 * source attributions and confidence indicators.
 */

import React from 'react';
import type { ReasoningTrace, ConfidenceResult } from '../types';

export interface ReasoningViewProps {
  trace: ReasoningTrace;
  confidence?: ConfidenceResult;
}

/**
 * ReasoningView renders a step-by-step reasoning trace.
 */
export const ReasoningView: React.FC<ReasoningViewProps> = ({ trace, confidence }) => {
  return (
    <div className="reasoning-view">
      <h3>Reasoning Trace</h3>
      <p className="query">Query: {trace.query}</p>
      <ol className="steps">
        {trace.steps.map((step) => {
          const stepConf = confidence?.stepScores.find((s) => s.stepId === step.id);
          return (
            <li key={step.id} className="step">
              <h4>{step.description}</h4>
              <p className="method">Method: {step.method}</p>
              <p className="result">{step.result}</p>
              <ul className="sources">
                {step.sources.map((source) => (
                  <li key={source.id}>{source.title} ({source.type})</li>
                ))}
              </ul>
              {stepConf && (
                <span className="confidence-badge">
                  {Math.round(stepConf.score * 100)}%
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
