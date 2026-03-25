/**
 * @module ReasoningTracer
 * @description Core tracing engine that records each step of an AI reasoning
 * process. Maintains an ordered log of steps, sources, and methods used
 * to arrive at a conclusion.
 */

import { v4 as uuid } from 'uuid';
import type {
  ReasoningTrace,
  ReasoningStep,
  ReasoningStepInput,
  TraceStatus,
} from '../types';

/**
 * ReasoningTracer captures the full reasoning path of an AI decision.
 * Each step is logged with its sources, method, and result, creating
 * a complete record for transparency and audit.
 *
 * @example
 * ```typescript
 * const tracer = new ReasoningTracer();
 * const trace = tracer.startTrace('What are the custody factors?');
 * tracer.addStep(trace.id, {
 *   description: 'Identify statutory factors',
 *   sources: [{ id: 's1', title: 'Family Code 3011', type: 'statute' }],
 *   method: 'source_analysis',
 *   result: 'Found 5 statutory factors'
 * });
 * const completed = tracer.complete(trace.id);
 * ```
 */
export class ReasoningTracer {
  private traces: Map<string, ReasoningTrace> = new Map();

  /**
   * Start a new reasoning trace for a query.
   * @param query - The user query that triggered reasoning
   * @param context - Optional context (jurisdiction, case type, etc.)
   * @returns The new trace in 'started' status
   */
  startTrace(query: string, context?: Record<string, unknown>): ReasoningTrace {
    const trace: ReasoningTrace = {
      id: uuid(),
      query,
      status: 'started',
      steps: [],
      startedAt: new Date().toISOString(),
      context,
    };

    this.traces.set(trace.id, trace);
    return trace;
  }

  /**
   * Add a reasoning step to an active trace.
   * Computes a preliminary confidence score based on source quality and method.
   *
   * @param traceId - The trace to add the step to
   * @param input - Step details including description, sources, method, and result
   * @returns The recorded step with computed confidence
   * @throws Error if trace not found or not in progress
   */
  addStep(traceId: string, input: ReasoningStepInput): ReasoningStep {
    const trace = this.getTrace(traceId);
    if (trace.status === 'completed' || trace.status === 'failed') {
      throw new Error(`Cannot add steps to ${trace.status} trace`);
    }

    trace.status = 'in_progress';

    const step: ReasoningStep = {
      id: uuid(),
      traceId,
      stepNumber: trace.steps.length + 1,
      description: input.description,
      sources: input.sources,
      method: input.method,
      result: input.result,
      confidence: this.computeStepConfidence(input),
      timestamp: new Date().toISOString(),
      metadata: input.metadata,
    };

    trace.steps.push(step);
    this.traces.set(traceId, trace);
    return step;
  }

  /**
   * Mark a trace as completed and compute aggregate confidence.
   * @param traceId - The trace to complete
   * @returns The completed trace
   */
  complete(traceId: string): ReasoningTrace {
    const trace = this.getTrace(traceId);
    if (trace.steps.length === 0) {
      throw new Error('Cannot complete a trace with no steps');
    }

    trace.status = 'completed';
    trace.completedAt = new Date().toISOString();
    trace.aggregateConfidence = this.computeAggregateConfidence(trace);
    this.traces.set(traceId, trace);
    return trace;
  }

  /**
   * Mark a trace as failed.
   * @param traceId - The trace that failed
   * @param reason - Why it failed
   */
  fail(traceId: string, reason: string): ReasoningTrace {
    const trace = this.getTrace(traceId);
    trace.status = 'failed';
    trace.completedAt = new Date().toISOString();
    trace.context = { ...trace.context, failureReason: reason };
    this.traces.set(traceId, trace);
    return trace;
  }

  /**
   * Retrieve a trace by ID.
   * @param traceId - The trace identifier
   * @returns The reasoning trace
   * @throws Error if not found
   */
  getTrace(traceId: string): ReasoningTrace {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    return trace;
  }

  /**
   * List all traces, optionally filtered by status.
   * @param status - Optional status filter
   */
  listTraces(status?: TraceStatus): ReasoningTrace[] {
    const all = Array.from(this.traces.values());
    return status ? all.filter((t) => t.status === status) : all;
  }

  /**
   * Get all unique sources used across a trace.
   * @param traceId - The trace identifier
   * @returns Deduplicated array of sources
   */
  getSources(traceId: string): import('../types').Source[] {
    const trace = this.getTrace(traceId);
    const seen = new Set<string>();
    const sources: import('../types').Source[] = [];

    for (const step of trace.steps) {
      for (const source of step.sources) {
        if (!seen.has(source.id)) {
          seen.add(source.id);
          sources.push(source);
        }
      }
    }

    return sources;
  }

  /**
   * Compute a preliminary confidence score for a step based on source quality
   * and reasoning method.
   */
  private computeStepConfidence(input: ReasoningStepInput): number {
    let score = 0.5; // Base confidence

    // Source count factor (more sources = higher confidence, diminishing returns)
    const sourceBonus = Math.min(input.sources.length * 0.1, 0.3);
    score += sourceBonus;

    // Source quality factor
    const avgQuality =
      input.sources.reduce(
        (sum, s) => sum + (s.qualityScore ?? 0.5),
        0
      ) / Math.max(input.sources.length, 1);
    score += avgQuality * 0.15;

    // Method confidence factor
    const methodScores: Record<string, number> = {
      source_analysis: 0.05,
      statutory_interpretation: 0.05,
      logical_deduction: 0.03,
      comparative_analysis: 0.02,
      analogical_reasoning: 0.0,
      synthesis: 0.02,
      factual_assessment: 0.04,
    };
    score += methodScores[input.method] ?? 0;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Compute aggregate confidence as the weighted average of step confidences,
   * penalized by chain weakness.
   */
  private computeAggregateConfidence(trace: ReasoningTrace): number {
    if (trace.steps.length === 0) return 0;

    const stepConfidences = trace.steps.map((s) => s.confidence);
    const average =
      stepConfidences.reduce((sum, c) => sum + c, 0) / stepConfidences.length;
    const minimum = Math.min(...stepConfidences);

    // Chain is weakened by its weakest link
    return average * 0.7 + minimum * 0.3;
  }
}
