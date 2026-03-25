/**
 * @module SourceTracker
 * @description Tracks which sources informed each reasoning step.
 * Validates source quality and maintains a registry of all sources used.
 */

import type { Source, SourceType } from '../types';

/**
 * SourceTracker manages source attribution throughout a reasoning trace.
 */
export class SourceTracker {
  private sources: Map<string, Source> = new Map();
  private stepSources: Map<string, string[]> = new Map();

  /**
   * Register a source.
   * @param source - The source to register
   */
  register(source: Source): void {
    this.sources.set(source.id, source);
  }

  /**
   * Link a source to a reasoning step.
   * @param stepId - The step ID
   * @param sourceId - The source ID
   */
  link(stepId: string, sourceId: string): void {
    if (!this.stepSources.has(stepId)) {
      this.stepSources.set(stepId, []);
    }
    this.stepSources.get(stepId)!.push(sourceId);
  }

  /**
   * Get all sources for a step.
   * @param stepId - The step ID
   */
  getStepSources(stepId: string): Source[] {
    const ids = this.stepSources.get(stepId) ?? [];
    return ids.map((id) => this.sources.get(id)).filter(Boolean) as Source[];
  }

  /**
   * Validate source quality score.
   * @param source - The source to validate
   * @returns Quality score (0-1)
   */
  assessQuality(source: Source): number {
    let score = 0.5;

    // Primary sources score higher
    const primaryTypes: SourceType[] = ['statute', 'case_law', 'regulation', 'constitutional'];
    if (primaryTypes.includes(source.type)) score += 0.2;

    // Recent sources score higher
    if (source.publishedAt) {
      const age = Date.now() - new Date(source.publishedAt).getTime();
      const yearsOld = age / (365.25 * 24 * 60 * 60 * 1000);
      if (yearsOld < 2) score += 0.15;
      else if (yearsOld < 5) score += 0.1;
      else if (yearsOld < 10) score += 0.05;
    }

    // URL available (verifiable)
    if (source.url) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Get all registered sources.
   */
  getAllSources(): Source[] {
    return Array.from(this.sources.values());
  }
}
