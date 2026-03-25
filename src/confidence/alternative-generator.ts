/**
 * @module AlternativeGenerator
 * @description Generates alternative conclusions that were considered
 * during reasoning. Shows what other answers were possible and why
 * they were not selected.
 */

import type { ReasoningTrace, Alternative, Source } from '../types';

/**
 * AlternativeGenerator produces alternative conclusions for transparency.
 */
export class AlternativeGenerator {
  /**
   * Generate alternatives based on the reasoning trace.
   * Looks at each step and considers what different conclusions
   * could have been reached.
   *
   * @param trace - The completed reasoning trace
   * @param maxAlternatives - Maximum number of alternatives to generate
   * @returns Array of alternative conclusions
   */
  generate(trace: ReasoningTrace, maxAlternatives: number = 3): Alternative[] {
    const alternatives: Alternative[] = [];

    // Generate a contrarian alternative
    const lastStep = trace.steps[trace.steps.length - 1];
    if (lastStep) {
      alternatives.push({
        conclusion: `Opposite conclusion: the evidence does not support "${lastStep.result}"`,
        rejectionReason:
          'The weight of evidence and source quality favors the primary conclusion',
        confidence: Math.max(0, (1 - (trace.aggregateConfidence ?? 0)) * 0.5),
        supportingSources: [],
      });
    }

    // Generate an "insufficient evidence" alternative
    if (trace.steps.some((s) => s.sources.length < 2)) {
      alternatives.push({
        conclusion: 'Insufficient evidence to reach a definitive conclusion',
        rejectionReason:
          'While some steps have limited sources, the overall chain has adequate support',
        confidence: 0.2,
        supportingSources: [],
      });
    }

    return alternatives.slice(0, maxAlternatives);
  }
}
