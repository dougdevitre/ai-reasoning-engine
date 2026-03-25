/**
 * @jest-environment node
 */

import { ExplanationGenerator } from '../src/explanation/explanation-generator';
import type { ReasoningTrace, ConfidenceResult } from '../src/types';

describe('ExplanationGenerator', () => {
  let generator: ExplanationGenerator;

  const mockTrace: ReasoningTrace = {
    id: 'trace_1',
    query: 'What are the custody factors?',
    status: 'completed',
    steps: [
      {
        id: 'step_1',
        traceId: 'trace_1',
        stepNumber: 1,
        description: 'Identify statutory factors',
        sources: [
          { id: 'src_1', title: 'Family Code 3011', type: 'statute', qualityScore: 0.9 },
        ],
        method: 'source_analysis',
        result: 'Found 5 statutory custody factors',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'step_2',
        traceId: 'trace_1',
        stepNumber: 2,
        description: 'Analyze case law',
        sources: [
          { id: 'src_2', title: 'In re Marriage of Brown', type: 'case_law', qualityScore: 0.8 },
        ],
        method: 'comparative_analysis',
        result: 'Courts apply a totality test',
        confidence: 0.75,
        timestamp: new Date().toISOString(),
      },
    ],
    aggregateConfidence: 0.8,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const mockConfidence: ConfidenceResult = {
    id: 'conf_1',
    traceId: 'trace_1',
    aggregate: 78,
    chainStrength: 70,
    stepScores: [
      { stepId: 'step_1', stepNumber: 1, score: 0.85, sourceQuality: 0.9, methodConfidence: 0.85, corroboration: 0.33, flags: [] },
      { stepId: 'step_2', stepNumber: 2, score: 0.75, sourceQuality: 0.8, methodConfidence: 0.70, corroboration: 0.33, flags: ['Limited corroboration'] },
    ],
    uncertainAreas: [],
    calculatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    generator = new ExplanationGenerator({ depth: 'detailed', showConfidence: true });
  });

  describe('explain()', () => {
    it('should generate a summary with source count and confidence', () => {
      const explanation = generator.explain(mockTrace, mockConfidence);
      expect(explanation.summary).toContain('2 sources');
      expect(explanation.summary).toContain('2 reasoning steps');
      expect(explanation.summary).toContain('78%');
    });

    it('should generate detailed step-by-step explanation', () => {
      const explanation = generator.explain(mockTrace, mockConfidence);
      expect(explanation.detailed).toContain('Step 1');
      expect(explanation.detailed).toContain('Step 2');
      expect(explanation.detailed).toContain('Family Code 3011');
      expect(explanation.detailed).toContain('Source Analysis');
    });

    it('should extract citations linking claims to sources', () => {
      const explanation = generator.explain(mockTrace, mockConfidence);
      expect(explanation.citations).toHaveLength(2);
      expect(explanation.citations[0].source.title).toBeDefined();
      expect(explanation.citations[0].claim).toBeDefined();
    });

    it('should include alternatives when provided', () => {
      const alternatives = [
        {
          conclusion: 'Alternative approach',
          rejectionReason: 'Insufficient evidence',
          confidence: 0.2,
          supportingSources: [],
        },
      ];

      const explanation = generator.explain(mockTrace, mockConfidence, alternatives);
      expect(explanation.alternatives).toHaveLength(1);
      expect(explanation.alternatives[0].conclusion).toBe('Alternative approach');
    });

    it('should set generatedAt timestamp', () => {
      const explanation = generator.explain(mockTrace, mockConfidence);
      expect(explanation.generatedAt).toBeDefined();
      expect(new Date(explanation.generatedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('confidence labels', () => {
    it('should label high confidence correctly', () => {
      const highConf = { ...mockConfidence, aggregate: 90 };
      const explanation = generator.explain(mockTrace, highConf);
      expect(explanation.summary).toContain('High');
    });

    it('should label low confidence correctly', () => {
      const lowConf = { ...mockConfidence, aggregate: 40 };
      const explanation = generator.explain(mockTrace, lowConf);
      expect(explanation.summary).toContain('Very Low');
    });
  });

  describe('without confidence', () => {
    it('should omit confidence when showConfidence is false', () => {
      const noConfGen = new ExplanationGenerator({ showConfidence: false });
      const explanation = noConfGen.explain(mockTrace, mockConfidence);
      expect(explanation.summary).not.toContain('%');
    });
  });
});
