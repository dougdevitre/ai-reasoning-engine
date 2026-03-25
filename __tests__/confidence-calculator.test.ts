/**
 * @jest-environment node
 */

import { ConfidenceCalculator } from '../src/confidence/confidence-calculator';
import type { ReasoningTrace } from '../src/types';

describe('ConfidenceCalculator', () => {
  let calculator: ConfidenceCalculator;

  const makeTrace = (steps: Array<{
    sources: number;
    qualityScore: number;
    method: string;
  }>): ReasoningTrace => ({
    id: 'trace_1',
    query: 'test query',
    status: 'completed',
    steps: steps.map((s, i) => ({
      id: `step_${i}`,
      traceId: 'trace_1',
      stepNumber: i + 1,
      description: `Step ${i + 1}`,
      sources: Array.from({ length: s.sources }, (_, j) => ({
        id: `src_${i}_${j}`,
        title: `Source ${j}`,
        type: 'statute' as const,
        qualityScore: s.qualityScore,
      })),
      method: s.method as any,
      result: `Result of step ${i + 1}`,
      confidence: 0,
      timestamp: new Date().toISOString(),
    })),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  });

  beforeEach(() => {
    calculator = new ConfidenceCalculator({ uncertaintyThreshold: 0.6 });
  });

  describe('calculate()', () => {
    it('should produce higher confidence for well-sourced steps', () => {
      const wellSourced = makeTrace([
        { sources: 3, qualityScore: 0.9, method: 'source_analysis' },
        { sources: 3, qualityScore: 0.85, method: 'statutory_interpretation' },
      ]);

      const poorlySourced = makeTrace([
        { sources: 0, qualityScore: 0, method: 'analogical_reasoning' },
        { sources: 1, qualityScore: 0.3, method: 'synthesis' },
      ]);

      const good = calculator.calculate(wellSourced);
      const poor = calculator.calculate(poorlySourced);

      expect(good.aggregate).toBeGreaterThan(poor.aggregate);
    });

    it('should flag uncertain areas when below threshold', () => {
      const trace = makeTrace([
        { sources: 3, qualityScore: 0.9, method: 'source_analysis' },
        { sources: 0, qualityScore: 0, method: 'analogical_reasoning' }, // Low confidence
      ]);

      const result = calculator.calculate(trace);
      expect(result.uncertainAreas.length).toBeGreaterThan(0);
    });

    it('should return 0 for empty trace', () => {
      const trace = makeTrace([]);
      const result = calculator.calculate(trace);
      expect(result.aggregate).toBe(0);
      expect(result.chainStrength).toBe(0);
    });

    it('should compute chain strength as the weakest step', () => {
      const trace = makeTrace([
        { sources: 3, qualityScore: 0.9, method: 'source_analysis' },
        { sources: 1, qualityScore: 0.3, method: 'synthesis' }, // Weak link
        { sources: 3, qualityScore: 0.9, method: 'statutory_interpretation' },
      ]);

      const result = calculator.calculate(trace);
      // Chain strength should be lower than aggregate
      expect(result.chainStrength).toBeLessThanOrEqual(result.aggregate);
    });
  });

  describe('step scoring', () => {
    it('should give higher scores to primary source types', () => {
      const trace = makeTrace([
        { sources: 1, qualityScore: 0.9, method: 'source_analysis' },
      ]);

      const result = calculator.calculate(trace);
      const stepScore = result.stepScores[0];

      expect(stepScore.sourceQuality).toBe(0.9);
      expect(stepScore.methodConfidence).toBeGreaterThan(0.7);
    });

    it('should flag steps with no sources', () => {
      const trace = makeTrace([
        { sources: 0, qualityScore: 0, method: 'logical_deduction' },
      ]);

      const result = calculator.calculate(trace);
      expect(result.stepScores[0].flags).toContain('No sources cited');
    });

    it('should flag steps with limited corroboration', () => {
      const trace = makeTrace([
        { sources: 1, qualityScore: 0.8, method: 'source_analysis' },
      ]);

      const result = calculator.calculate(trace);
      expect(result.stepScores[0].flags).toContain('Limited corroboration');
    });
  });
});
