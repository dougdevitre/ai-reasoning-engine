/**
 * @module @justice-os/reasoning-engine
 * @description AI transparency layer for legal applications. Provides step-by-step
 * reasoning traces, source attribution, confidence scoring, and explainable decisions.
 */

// Tracing
export { ReasoningTracer } from './tracing/reasoning-tracer';
export { StepLogger } from './tracing/step-logger';
export { SourceTracker } from './tracing/source-tracker';
export { DecisionTreeBuilder } from './tracing/decision-tree';

// Confidence
export { ConfidenceCalculator } from './confidence/confidence-calculator';
export { UncertaintyFlagger } from './confidence/uncertainty-flagger';
export { AlternativeGenerator } from './confidence/alternative-generator';

// Explanation
export { ExplanationGenerator } from './explanation/explanation-generator';
export { VisualTreeRenderer } from './explanation/visual-tree';
export { CitationLinker } from './explanation/citation-linker';

// Audit
export { AuditTrail } from './audit/audit-trail';
export { ComplianceReporter } from './audit/compliance-reporter';

// Types
export * from './types';
