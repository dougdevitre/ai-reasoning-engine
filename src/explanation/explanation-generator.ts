/**
 * @module ExplanationGenerator
 * @description Generates natural language explanations of AI reasoning.
 * Translates step-by-step traces into human-readable narratives with
 * source citations and confidence indicators.
 */

import { v4 as uuid } from 'uuid';
import type {
  ReasoningTrace,
  ConfidenceResult,
  Explanation,
  Citation,
  Alternative,
  Source,
} from '../types';

/** Depth of explanation detail */
export type ExplanationDepth = 'brief' | 'standard' | 'detailed';

/** Configuration for the explanation generator */
export interface ExplanationConfig {
  /** Level of detail (brief, standard, detailed) */
  depth?: ExplanationDepth;
  /** Maximum number of alternatives to include */
  maxAlternatives?: number;
  /** Whether to include confidence indicators */
  showConfidence?: boolean;
}

/**
 * ExplanationGenerator creates human-readable explanations from reasoning
 * traces. Supports multiple detail levels and includes source citations.
 *
 * @example
 * ```typescript
 * const explainer = new ExplanationGenerator({ depth: 'detailed' });
 * const explanation = explainer.explain(trace, confidenceResult);
 * console.log(explanation.summary);
 * console.log(explanation.detailed);
 * ```
 */
export class ExplanationGenerator {
  private config: ExplanationConfig;

  constructor(config: ExplanationConfig = {}) {
    this.config = {
      depth: config.depth ?? 'standard',
      maxAlternatives: config.maxAlternatives ?? 3,
      showConfidence: config.showConfidence ?? true,
    };
  }

  /**
   * Generate a full explanation for a reasoning trace.
   *
   * @param trace - The completed reasoning trace
   * @param confidence - The confidence analysis result
   * @param alternatives - Optional alternative conclusions
   * @returns A structured explanation with summary, detail, and citations
   */
  explain(
    trace: ReasoningTrace,
    confidence: ConfidenceResult,
    alternatives?: Alternative[]
  ): Explanation {
    const citations = this.extractCitations(trace);
    const summary = this.generateSummary(trace, confidence);
    const detailed = this.generateDetailed(trace, confidence, citations);

    return {
      id: uuid(),
      traceId: trace.id,
      summary,
      detailed,
      citations,
      alternatives: alternatives?.slice(0, this.config.maxAlternatives!) ?? [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate the "Why this answer?" one-line summary.
   *
   * @param trace - The reasoning trace
   * @param confidence - Confidence scores
   * @returns A concise summary sentence
   */
  private generateSummary(
    trace: ReasoningTrace,
    confidence: ConfidenceResult
  ): string {
    const lastStep = trace.steps[trace.steps.length - 1];
    if (!lastStep) return 'No reasoning steps recorded.';

    const sourceCount = this.getUniqueSourceCount(trace);
    const confidenceLabel = this.confidenceLabel(confidence.aggregate);

    const parts: string[] = [
      `Based on ${sourceCount} source${sourceCount !== 1 ? 's' : ''}`,
      `and ${trace.steps.length} reasoning step${trace.steps.length !== 1 ? 's' : ''},`,
      lastStep.result.endsWith('.') ? lastStep.result : `${lastStep.result}.`,
    ];

    if (this.config.showConfidence) {
      parts.push(`(Confidence: ${confidenceLabel}, ${confidence.aggregate}%)`);
    }

    return parts.join(' ');
  }

  /**
   * Generate a detailed step-by-step explanation.
   *
   * @param trace - The reasoning trace
   * @param confidence - Confidence scores
   * @param citations - Extracted citations
   * @returns Multi-paragraph detailed explanation
   */
  private generateDetailed(
    trace: ReasoningTrace,
    confidence: ConfidenceResult,
    citations: Citation[]
  ): string {
    const sections: string[] = [];

    // Introduction
    sections.push(
      `To answer the question "${trace.query}", the following reasoning process was followed:`
    );

    // Step-by-step narrative
    for (const step of trace.steps) {
      const stepConf = confidence.stepScores.find(
        (s) => s.stepId === step.id
      );
      const confText = stepConf && this.config.showConfidence
        ? ` [Confidence: ${Math.round(stepConf.score * 100)}%]`
        : '';

      const sourceRefs = step.sources
        .map((s) => `[${s.title}]`)
        .join(', ');

      sections.push(
        `Step ${step.stepNumber}: ${step.description}${confText}\n` +
        `Method: ${this.formatMethod(step.method)}\n` +
        `Sources: ${sourceRefs || 'None'}\n` +
        `Finding: ${step.result}`
      );
    }

    // Uncertainty flags
    if (confidence.uncertainAreas.length > 0) {
      sections.push(
        `\nAreas of uncertainty:\n` +
        confidence.uncertainAreas.map((a) => `  - ${a}`).join('\n')
      );
    }

    // Overall assessment
    sections.push(
      `\nOverall confidence: ${confidence.aggregate}% (${this.confidenceLabel(confidence.aggregate)})`
    );

    return sections.join('\n\n');
  }

  /**
   * Extract all citations from a trace, linking claims to sources.
   */
  private extractCitations(trace: ReasoningTrace): Citation[] {
    const citations: Citation[] = [];

    for (const step of trace.steps) {
      for (const source of step.sources) {
        citations.push({
          claim: step.result,
          source,
          relevance: source.qualityScore ?? 0.5,
        });
      }
    }

    return citations;
  }

  /**
   * Count unique sources across all steps.
   */
  private getUniqueSourceCount(trace: ReasoningTrace): number {
    const seen = new Set<string>();
    for (const step of trace.steps) {
      for (const source of step.sources) {
        seen.add(source.id);
      }
    }
    return seen.size;
  }

  /**
   * Convert a confidence percentage to a human-readable label.
   */
  private confidenceLabel(score: number): string {
    if (score >= 85) return 'High';
    if (score >= 65) return 'Moderate';
    if (score >= 45) return 'Low';
    return 'Very Low';
  }

  /**
   * Format a reasoning method name for display.
   */
  private formatMethod(method: string): string {
    return method
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
