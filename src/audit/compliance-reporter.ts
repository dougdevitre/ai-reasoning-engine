/**
 * @module ComplianceReporter
 * @description Generates compliance reports from audit trail data.
 * Produces summaries suitable for regulatory review and quality assurance.
 */

import type { AuditEntry } from '../types';

/** A compliance report */
export interface ComplianceReport {
  traceId: string;
  totalSteps: number;
  totalSources: number;
  averageConfidence: number;
  uncertainAreas: string[];
  integrityVerified: boolean;
  generatedAt: string;
}

/**
 * ComplianceReporter generates reports from audit trail data.
 */
export class ComplianceReporter {
  /**
   * Generate a compliance report from audit entries.
   * @param entries - Audit entries for a single trace
   * @param integrityPassed - Whether integrity verification passed
   * @returns A structured compliance report
   */
  generate(entries: AuditEntry[], integrityPassed: boolean): ComplianceReport {
    const traceEntry = entries.find((e) => e.eventType === 'trace_completed');
    const confEntry = entries.find((e) => e.eventType === 'confidence_calculated');
    const stepEntries = entries.filter((e) => e.eventType === 'step_recorded');

    const totalSources = stepEntries.reduce(
      (sum, e) => sum + ((e.payload.sourceCount as number) ?? 0),
      0
    );

    return {
      traceId: traceEntry?.traceId ?? 'unknown',
      totalSteps: stepEntries.length,
      totalSources,
      averageConfidence: (confEntry?.payload.aggregate as number) ?? 0,
      uncertainAreas: (confEntry?.payload.uncertainAreas as string[]) ?? [],
      integrityVerified: integrityPassed,
      generatedAt: new Date().toISOString(),
    };
  }
}
