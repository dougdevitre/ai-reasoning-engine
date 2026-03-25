/**
 * @module StepLogger
 * @description Structured logger for individual reasoning steps.
 * Captures timing, method, and result for each inference.
 */

import type { ReasoningStep } from '../types';

/** Log level for step entries */
export type StepLogLevel = 'debug' | 'info' | 'warn' | 'error';

/** A log entry for a step */
export interface StepLogEntry {
  traceId: string;
  stepId: string;
  stepNumber: number;
  level: StepLogLevel;
  message: string;
  timestamp: string;
}

/**
 * StepLogger provides structured logging for reasoning steps.
 */
export class StepLogger {
  private entries: StepLogEntry[] = [];

  /**
   * Log a step event.
   * @param step - The reasoning step
   * @param level - Log level
   * @param message - Log message
   */
  log(step: ReasoningStep, level: StepLogLevel, message: string): StepLogEntry {
    const entry: StepLogEntry = {
      traceId: step.traceId,
      stepId: step.id,
      stepNumber: step.stepNumber,
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  /**
   * Get log entries for a trace.
   * @param traceId - The trace identifier
   * @param level - Optional minimum level filter
   */
  getEntries(traceId: string, level?: StepLogLevel): StepLogEntry[] {
    const levels: StepLogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minIndex = level ? levels.indexOf(level) : 0;
    return this.entries.filter(
      (e) => e.traceId === traceId && levels.indexOf(e.level) >= minIndex
    );
  }

  /** Clear all entries. */
  clear(): void {
    this.entries = [];
  }
}
