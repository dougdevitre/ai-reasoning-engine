/**
 * @module UncertaintyFlagger
 * @description Identifies and flags areas of low confidence in reasoning traces.
 * Helps users understand where the AI is guessing vs. where it has strong evidence.
 */

import type { ConfidenceResult, StepConfidence } from '../types';

/** An uncertainty flag with context */
export interface UncertaintyFlag {
  stepNumber: number;
  stepId: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  suggestion: string;
}

/**
 * UncertaintyFlagger analyzes confidence results and generates
 * actionable flags for uncertain reasoning areas.
 */
export class UncertaintyFlagger {
  private highThreshold: number;
  private mediumThreshold: number;

  constructor(highThreshold: number = 0.4, mediumThreshold: number = 0.6) {
    this.highThreshold = highThreshold;
    this.mediumThreshold = mediumThreshold;
  }

  /**
   * Generate uncertainty flags from confidence results.
   * @param result - The confidence analysis
   * @returns Array of actionable uncertainty flags
   */
  flag(result: ConfidenceResult): UncertaintyFlag[] {
    const flags: UncertaintyFlag[] = [];

    for (const step of result.stepScores) {
      if (step.score < this.highThreshold) {
        flags.push({
          stepNumber: step.stepNumber,
          stepId: step.stepId,
          severity: 'high',
          reason: this.diagnose(step),
          suggestion: this.suggest(step, 'high'),
        });
      } else if (step.score < this.mediumThreshold) {
        flags.push({
          stepNumber: step.stepNumber,
          stepId: step.stepId,
          severity: 'medium',
          reason: this.diagnose(step),
          suggestion: this.suggest(step, 'medium'),
        });
      }
    }

    return flags;
  }

  private diagnose(step: StepConfidence): string {
    const issues: string[] = [];
    if (step.sourceQuality < 0.4) issues.push('low source quality');
    if (step.corroboration < 0.3) issues.push('insufficient corroboration');
    if (step.methodConfidence < 0.5) issues.push('unreliable reasoning method');
    return issues.length > 0
      ? `Uncertainty due to ${issues.join(', ')}`
      : 'General low confidence';
  }

  private suggest(step: StepConfidence, severity: string): string {
    if (step.corroboration < 0.3) return 'Add additional sources to corroborate this step';
    if (step.sourceQuality < 0.4) return 'Replace with higher-authority sources';
    return 'Review this step manually before relying on the conclusion';
  }
}
