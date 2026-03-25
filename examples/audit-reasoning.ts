/**
 * @example Audit Reasoning
 * @description Records a complete reasoning decision to the audit trail
 * and generates a compliance report.
 */

import {
  ReasoningTracer,
  ConfidenceCalculator,
  ExplanationGenerator,
  AuditTrail,
  ComplianceReporter,
} from '../src';

async function auditReasoning() {
  const tracer = new ReasoningTracer();
  const trace = tracer.startTrace('Is this filing eligible for fee waiver?');

  tracer.addStep(trace.id, {
    description: 'Check fee waiver eligibility criteria',
    sources: [{
      id: 'gov_code_68631', title: 'Government Code Section 68631', type: 'statute',
      qualityScore: 0.95, jurisdiction: 'california',
    }],
    method: 'source_analysis',
    result: 'Fee waiver available if income is at or below 125% of federal poverty guidelines',
  });

  tracer.addStep(trace.id, {
    description: 'Apply income threshold to reported income',
    sources: [{
      id: 'fpl_2024', title: 'Federal Poverty Guidelines 2024', type: 'regulation',
      qualityScore: 0.9,
    }],
    method: 'factual_assessment',
    result: 'Reported income of $18,000 for household of 2 is below the 125% threshold of $24,650',
  });

  const completed = tracer.complete(trace.id);

  // Calculate confidence and generate explanation
  const confidence = new ConfidenceCalculator().calculate(completed);
  const explanation = new ExplanationGenerator().explain(completed, confidence);

  // --- Record to audit trail ---
  const audit = new AuditTrail();
  const entries = audit.record(completed, confidence, explanation);
  console.log(`Recorded ${entries.length} audit entries`);

  // --- Verify integrity ---
  const isValid = audit.verifyIntegrity(trace.id);
  console.log(`Integrity check: ${isValid ? 'PASSED' : 'FAILED'}`);

  // --- Generate compliance report ---
  const reporter = new ComplianceReporter();
  const auditEntries = audit.getEntries(trace.id);
  const report = reporter.generate(auditEntries, isValid);

  console.log('\n=== Compliance Report ===');
  console.log(`Trace ID: ${report.traceId}`);
  console.log(`Steps: ${report.totalSteps}`);
  console.log(`Sources: ${report.totalSources}`);
  console.log(`Confidence: ${report.averageConfidence}%`);
  console.log(`Integrity: ${report.integrityVerified ? 'Verified' : 'Failed'}`);

  if (report.uncertainAreas.length > 0) {
    console.log(`Uncertain areas: ${report.uncertainAreas.join(', ')}`);
  }
}

auditReasoning().catch(console.error);
