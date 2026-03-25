/**
 * @module WhyThisAnswer
 * @description "Why?" button with explanation popover. Provides one-click
 * access to the reasoning behind any AI-generated answer.
 */

import React, { useState } from 'react';
import type { Explanation } from '../types';

export interface WhyThisAnswerProps {
  explanation: Explanation;
  buttonText?: string;
}

/**
 * WhyThisAnswer renders a "Why this answer?" button with an expandable explanation.
 */
export const WhyThisAnswer: React.FC<WhyThisAnswerProps> = ({
  explanation,
  buttonText = 'Why this answer?',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="why-this-answer">
      <button onClick={() => setIsOpen(!isOpen)} className="why-button" aria-expanded={isOpen}>
        {buttonText}
      </button>
      {isOpen && (
        <div className="explanation-popover" role="dialog">
          <p className="summary">{explanation.summary}</p>
          <details>
            <summary>Full explanation</summary>
            <pre className="detailed">{explanation.detailed}</pre>
          </details>
          {explanation.citations.length > 0 && (
            <div className="citations">
              <h4>Sources ({explanation.citations.length})</h4>
              <ul>
                {explanation.citations.map((c, i) => (
                  <li key={i}>{c.source.title} ({c.source.type})</li>
                ))}
              </ul>
            </div>
          )}
          {explanation.alternatives.length > 0 && (
            <div className="alternatives">
              <h4>Alternatives considered</h4>
              <ul>
                {explanation.alternatives.map((alt, i) => (
                  <li key={i}>
                    <strong>{alt.conclusion}</strong> — {alt.rejectionReason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
