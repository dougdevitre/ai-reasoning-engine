/**
 * @module @justice-os/reasoning-engine/types
 * @description Core type definitions for the AI Reasoning Transparency Engine.
 */

/** Status of a reasoning trace */
export type TraceStatus = 'started' | 'in_progress' | 'completed' | 'failed';

/** Types of legal sources */
export type SourceType =
  | 'statute'
  | 'case_law'
  | 'regulation'
  | 'research'
  | 'treatise'
  | 'practice_guide'
  | 'court_rule'
  | 'constitutional'
  | 'secondary';

/** Reasoning methods used in a step */
export type ReasoningMethod =
  | 'source_analysis'
  | 'comparative_analysis'
  | 'logical_deduction'
  | 'statutory_interpretation'
  | 'analogical_reasoning'
  | 'synthesis'
  | 'factual_assessment';

/** Decision tree node types */
export type NodeType = 'root' | 'inference' | 'conclusion' | 'alternative' | 'evidence';

/**
 * A legal source referenced during reasoning.
 */
export interface Source {
  /** Unique source identifier */
  id: string;
  /** Source title or citation */
  title: string;
  /** Type of legal source */
  type: SourceType;
  /** URL or reference link */
  url?: string;
  /** Jurisdiction this source applies to */
  jurisdiction?: string;
  /** Quality score (0-1) based on authority and recency */
  qualityScore?: number;
  /** When the source was published */
  publishedAt?: string;
}

/**
 * Input for adding a reasoning step to a trace.
 */
export interface ReasoningStepInput {
  /** Human-readable description of what this step does */
  description: string;
  /** Sources consulted in this step */
  sources: Source[];
  /** The reasoning method applied */
  method: ReasoningMethod;
  /** The result or conclusion of this step */
  result: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A recorded reasoning step with computed fields.
 */
export interface ReasoningStep {
  /** Unique step identifier */
  id: string;
  /** Parent trace identifier */
  traceId: string;
  /** Step order (1-based) */
  stepNumber: number;
  /** What this step does */
  description: string;
  /** Sources used */
  sources: Source[];
  /** Method applied */
  method: ReasoningMethod;
  /** Step result */
  result: string;
  /** Computed confidence for this step */
  confidence: number;
  /** When this step was recorded */
  timestamp: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A complete reasoning trace from query to conclusion.
 */
export interface ReasoningTrace {
  /** Unique trace identifier */
  id: string;
  /** The original query that triggered reasoning */
  query: string;
  /** Current trace status */
  status: TraceStatus;
  /** Ordered reasoning steps */
  steps: ReasoningStep[];
  /** Aggregate confidence score */
  aggregateConfidence?: number;
  /** When the trace started */
  startedAt: string;
  /** When the trace completed */
  completedAt?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Confidence scores for a reasoning trace.
 */
export interface ConfidenceResult {
  /** Unique result identifier */
  id: string;
  /** Associated trace */
  traceId: string;
  /** Overall confidence score (0-100) */
  aggregate: number;
  /** Weakest step confidence (chain is only as strong as weakest link) */
  chainStrength: number;
  /** Per-step confidence scores */
  stepScores: StepConfidence[];
  /** Areas flagged as uncertain */
  uncertainAreas: string[];
  /** When this was calculated */
  calculatedAt: string;
}

/**
 * Confidence breakdown for a single step.
 */
export interface StepConfidence {
  stepId: string;
  stepNumber: number;
  score: number;
  sourceQuality: number;
  methodConfidence: number;
  corroboration: number;
  flags: string[];
}

/**
 * A generated explanation for a reasoning trace.
 */
export interface Explanation {
  /** Unique explanation identifier */
  id: string;
  /** Associated trace */
  traceId: string;
  /** One-sentence summary */
  summary: string;
  /** Full detailed explanation */
  detailed: string;
  /** Source citations used */
  citations: Citation[];
  /** Alternative conclusions considered */
  alternatives: Alternative[];
  /** When this was generated */
  generatedAt: string;
}

/**
 * A citation linking a claim to a source.
 */
export interface Citation {
  /** The claim being cited */
  claim: string;
  /** The source supporting it */
  source: Source;
  /** Relevant excerpt from the source */
  excerpt?: string;
  /** Confidence in this citation's relevance */
  relevance: number;
}

/**
 * An alternative conclusion that was considered.
 */
export interface Alternative {
  /** The alternative conclusion */
  conclusion: string;
  /** Why it was not selected */
  rejectionReason: string;
  /** Confidence score for this alternative */
  confidence: number;
  /** Sources that would support this alternative */
  supportingSources: Source[];
}

/**
 * A node in the decision tree visualization.
 */
export interface DecisionNode {
  /** Unique node identifier */
  id: string;
  /** Parent trace */
  traceId: string;
  /** Parent node (null for root) */
  parentId: string | null;
  /** Display label */
  label: string;
  /** Node type */
  type: NodeType;
  /** Confidence at this node */
  confidence: number;
  /** Child nodes */
  children: DecisionNode[];
  /** Additional data */
  metadata?: Record<string, unknown>;
}

/**
 * An immutable audit entry.
 */
export interface AuditEntry {
  /** Unique entry identifier */
  id: string;
  /** Associated trace */
  traceId: string;
  /** Type of event */
  eventType: string;
  /** Who/what triggered this event */
  actor: string;
  /** SHA-256 hash of the payload for integrity verification */
  contentHash: string;
  /** Event payload */
  payload: Record<string, unknown>;
  /** When this occurred */
  timestamp: string;
}
