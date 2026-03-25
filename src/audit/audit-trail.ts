/**
 * @module AuditTrail
 * @description Immutable audit trail for AI reasoning decisions.
 * Records every trace, step, confidence calculation, and explanation
 * with content hashing for integrity verification.
 */

import { v4 as uuid } from 'uuid';
import type {
  AuditEntry,
  ReasoningTrace,
  ConfidenceResult,
  Explanation,
} from '../types';

/**
 * AuditTrail maintains an append-only log of all AI reasoning activity.
 * Each entry is hashed for integrity verification.
 *
 * @example
 * ```typescript
 * const audit = new AuditTrail();
 * audit.record(trace, confidenceResult, explanation);
 * const entries = audit.getEntries(traceId);
 * const isValid = audit.verifyIntegrity(traceId);
 * ```
 */
export class AuditTrail {
  private entries: AuditEntry[] = [];

  /**
   * Record a complete reasoning decision to the audit trail.
   *
   * @param trace - The reasoning trace
   * @param confidence - The confidence result
   * @param explanation - The generated explanation
   */
  record(
    trace: ReasoningTrace,
    confidence: ConfidenceResult,
    explanation: Explanation
  ): AuditEntry[] {
    const recorded: AuditEntry[] = [];

    // Record trace completion
    recorded.push(this.addEntry(trace.id, 'trace_completed', 'system', {
      query: trace.query,
      stepCount: trace.steps.length,
      status: trace.status,
    }));

    // Record each step
    for (const step of trace.steps) {
      recorded.push(this.addEntry(trace.id, 'step_recorded', 'system', {
        stepNumber: step.stepNumber,
        method: step.method,
        sourceCount: step.sources.length,
        confidence: step.confidence,
      }));
    }

    // Record confidence calculation
    recorded.push(this.addEntry(trace.id, 'confidence_calculated', 'system', {
      aggregate: confidence.aggregate,
      chainStrength: confidence.chainStrength,
      uncertainAreas: confidence.uncertainAreas,
    }));

    // Record explanation generation
    recorded.push(this.addEntry(trace.id, 'explanation_generated', 'system', {
      summary: explanation.summary,
      citationCount: explanation.citations.length,
      alternativeCount: explanation.alternatives.length,
    }));

    return recorded;
  }

  /**
   * Add a single entry to the audit trail.
   *
   * @param traceId - The associated trace
   * @param eventType - Type of event
   * @param actor - Who/what triggered this
   * @param payload - Event data
   * @returns The created audit entry
   */
  addEntry(
    traceId: string,
    eventType: string,
    actor: string,
    payload: Record<string, unknown>
  ): AuditEntry {
    const entry: AuditEntry = {
      id: uuid(),
      traceId,
      eventType,
      actor,
      contentHash: this.computeHash(payload),
      payload,
      timestamp: new Date().toISOString(),
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * Get all audit entries for a trace.
   * @param traceId - The trace identifier
   * @returns Chronologically ordered audit entries
   */
  getEntries(traceId: string): AuditEntry[] {
    return this.entries
      .filter((e) => e.traceId === traceId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Verify the integrity of all entries for a trace.
   * Recomputes hashes and compares with stored values.
   *
   * @param traceId - The trace to verify
   * @returns true if all entries pass integrity check
   */
  verifyIntegrity(traceId: string): boolean {
    const entries = this.getEntries(traceId);
    return entries.every(
      (entry) => entry.contentHash === this.computeHash(entry.payload)
    );
  }

  /**
   * Compute a simple hash for integrity checking.
   * In production, use SHA-256.
   */
  private computeHash(payload: Record<string, unknown>): string {
    const str = JSON.stringify(payload, Object.keys(payload).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Get total entry count.
   */
  get totalEntries(): number {
    return this.entries.length;
  }
}
