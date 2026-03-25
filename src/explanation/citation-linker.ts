/**
 * @module CitationLinker
 * @description Links claims in AI output to their supporting legal sources.
 * Creates verifiable citation trails for every factual claim.
 */

import type { Citation, Source, ReasoningTrace } from '../types';

/**
 * CitationLinker connects claims to sources for verification.
 */
export class CitationLinker {
  /**
   * Extract all citations from a reasoning trace.
   * @param trace - The trace to extract from
   * @returns Array of citations linking claims to sources
   */
  extractCitations(trace: ReasoningTrace): Citation[] {
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

    // Sort by relevance (highest first)
    return citations.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Format citations in a legal citation style.
   * @param citations - Citations to format
   * @returns Formatted citation list
   */
  format(citations: Citation[]): string[] {
    return citations.map((c, i) => {
      const num = i + 1;
      const sourceRef = c.source.url
        ? `${c.source.title}, available at ${c.source.url}`
        : c.source.title;
      return `[${num}] ${sourceRef} (${c.source.type}, relevance: ${Math.round(c.relevance * 100)}%)`;
    });
  }

  /**
   * Verify that all claims have at least one source.
   * @param trace - The trace to verify
   * @returns Array of unsourced claims
   */
  findUnsourcedClaims(trace: ReasoningTrace): string[] {
    return trace.steps
      .filter((s) => s.sources.length === 0)
      .map((s) => s.result);
  }
}
