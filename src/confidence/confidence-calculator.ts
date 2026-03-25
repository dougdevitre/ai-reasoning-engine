/**
 * @module ConfidenceCalculator
 * @description Computes detailed confidence scores for each reasoning step
 * and the overall trace. Identifies uncertain areas and flags them for review.
 */

import { v4 as uuid } from 'uuid';
import type {
  ReasoningTrace,
  ConfidenceResult,
  StepConfidence,
  ReasoningStep,
} from '../types';

/** Configuration for confidence calculation */
export interface ConfidenceConfig {
  /** Minimum acceptable confidence (steps below this are flagged) */
  uncertaintyThreshold?: number;
  /** Weight given to source quality */
  sourceQualityWeight?: number;
  /** Weight given to method confidence */
  methodWeight?: number;
  /** Weight given to corroboration (multiple sources agreeing) */
  corroborationWeight?: number;
}

/**
 * ConfidenceCalculator scores each reasoning step and produces an aggregate
 * confidence result with uncertainty flags.
 *
 * @example
 * ```typescript
 * const calculator = new ConfidenceCalculator({ uncertaintyThreshold: 0.6 });
 * const result = calculator.calculate(trace);
 * console.log(`Confidence: ${result.aggregate}%`);
 * console.log(`Uncertain: ${result.uncertainAreas.join(', ')}`);
 * ```
 */
export class ConfidenceCalculator {
  private config: ConfidenceConfig;

  /** Method reliability scores (higher = more reliable) */
  private static readonly METHOD_SCORES: Record<string, number> = {
    source_analysis: 0.85,
    statutory_interpretation: 0.80,
    logical_deduction: 0.75,
    comparative_analysis: 0.70,
    factual_assessment: 0.80,
    analogical_reasoning: 0.60,
    synthesis: 0.65,
  };

  constructor(config: ConfidenceConfig = {}) {
    this.config = {
      uncertaintyThreshold: config.uncertaintyThreshold ?? 0.6,
      sourceQualityWeight: config.sourceQualityWeight ?? 0.4,
      methodWeight: config.methodWeight ?? 0.3,
      corroborationWeight: config.corroborationWeight ?? 0.3,
    };
  }

  /**
   * Calculate confidence scores for an entire reasoning trace.
   *
   * @param trace - The reasoning trace to evaluate
   * @returns Detailed confidence result with per-step scores and uncertainty flags
   */
  calculate(trace: ReasoningTrace): ConfidenceResult {
    const stepScores = trace.steps.map((step) => this.scoreStep(step));

    const aggregate = this.computeAggregate(stepScores);
    const chainStrength = stepScores.length > 0
      ? Math.min(...stepScores.map((s) => s.score)) * 100
      : 0;

    const uncertainAreas = stepScores
      .filter((s) => s.score < this.config.uncertaintyThreshold!)
      .map((s) => `Step ${s.stepNumber}: ${s.flags.join(', ')}`);

    return {
      id: uuid(),
      traceId: trace.id,
      aggregate,
      chainStrength,
      stepScores,
      uncertainAreas,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Score an individual reasoning step.
   * Considers source quality, reasoning method, and corroboration.
   *
   * @param step - The reasoning step to score
   * @returns Step confidence breakdown
   */
  private scoreStep(step: ReasoningStep): StepConfidence {
    const flags: string[] = [];

    // Source quality (average of source quality scores)
    const sourceQuality = step.sources.length > 0
      ? step.sources.reduce(
          (sum, s) => sum + (s.qualityScore ?? 0.5),
          0
        ) / step.sources.length
      : 0;

    if (step.sources.length === 0) {
      flags.push('No sources cited');
    }
    if (sourceQuality < 0.5) {
      flags.push('Low source quality');
    }

    // Method confidence
    const methodConfidence =
      ConfidenceCalculator.METHOD_SCORES[step.method] ?? 0.5;

    // Corroboration (multiple sources supporting the same step)
    const corroboration = Math.min(step.sources.length / 3, 1.0);
    if (step.sources.length < 2) {
      flags.push('Limited corroboration');
    }

    // Weighted score
    const score =
      sourceQuality * this.config.sourceQualityWeight! +
      methodConfidence * this.config.methodWeight! +
      corroboration * this.config.corroborationWeight!;

    if (score < this.config.uncertaintyThreshold!) {
      flags.push('Below confidence threshold');
    }

    return {
      stepId: step.id,
      stepNumber: step.stepNumber,
      score,
      sourceQuality,
      methodConfidence,
      corroboration,
      flags,
    };
  }

  /**
   * Compute aggregate confidence from step scores.
   * Uses a weighted approach that penalizes weak links in the reasoning chain.
   *
   * @param stepScores - Individual step scores
   * @returns Aggregate confidence (0-100)
   */
  private computeAggregate(stepScores: StepConfidence[]): number {
    if (stepScores.length === 0) return 0;

    const average =
      stepScores.reduce((sum, s) => sum + s.score, 0) / stepScores.length;
    const minimum = Math.min(...stepScores.map((s) => s.score));

    // Weighted: 70% average, 30% weakest link
    const raw = average * 0.7 + minimum * 0.3;

    return Math.round(raw * 100);
  }
}
