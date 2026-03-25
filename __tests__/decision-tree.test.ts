/**
 * @jest-environment node
 */

import { DecisionTreeBuilder } from '../src/tracing/decision-tree';
import type { ReasoningTrace } from '../src/types';

describe('DecisionTreeBuilder', () => {
  let builder: DecisionTreeBuilder;

  const mockTrace: ReasoningTrace = {
    id: 'trace_1',
    query: 'Should I file for custody modification?',
    status: 'completed',
    steps: [
      {
        id: 'step_1',
        traceId: 'trace_1',
        stepNumber: 1,
        description: 'Analyze change in circumstances',
        sources: [
          { id: 'src_1', title: 'Family Code 3087', type: 'statute', qualityScore: 0.9 },
        ],
        method: 'statutory_interpretation',
        result: 'Substantial change requirement applies',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'step_2',
        traceId: 'trace_1',
        stepNumber: 2,
        description: 'Evaluate facts against standard',
        sources: [
          { id: 'src_2', title: 'In re Marriage of LaMusga', type: 'case_law', qualityScore: 0.8 },
          { id: 'src_3', title: 'Burden v. Snowden', type: 'case_law', qualityScore: 0.75 },
        ],
        method: 'factual_assessment',
        result: 'Reported changes meet the substantial change threshold',
        confidence: 0.78,
        timestamp: new Date().toISOString(),
      },
    ],
    aggregateConfidence: 0.82,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    builder = new DecisionTreeBuilder();
  });

  describe('build()', () => {
    it('should create a root node from the query', () => {
      const tree = builder.build(mockTrace);
      expect(tree.type).toBe('root');
      expect(tree.label).toBe('Should I file for custody modification?');
      expect(tree.parentId).toBeNull();
    });

    it('should create child nodes for each step', () => {
      const tree = builder.build(mockTrace);
      expect(tree.children).toHaveLength(1); // First step is child of root
      expect(tree.children[0].label).toBe('Analyze change in circumstances');
    });

    it('should create evidence nodes for sources', () => {
      const tree = builder.build(mockTrace);
      const step1 = tree.children[0];
      const evidenceNodes = step1.children.filter((c) => c.type === 'evidence');
      expect(evidenceNodes).toHaveLength(1);
      expect(evidenceNodes[0].label).toBe('Family Code 3087');
    });

    it('should mark the last step conclusion', () => {
      const tree = builder.build(mockTrace);
      // Navigate to last step
      const step1 = tree.children[0];
      const step2 = step1.children.find((c) => c.type !== 'evidence');
      expect(step2).toBeDefined();

      // The last step should have a conclusion child
      const allNodes = builder.flatten(tree);
      const conclusions = allNodes.filter((n) => n.type === 'conclusion');
      expect(conclusions).toHaveLength(1);
    });

    it('should set confidence on each node', () => {
      const tree = builder.build(mockTrace);
      expect(tree.confidence).toBe(0.82);
      expect(tree.children[0].confidence).toBe(0.85);
    });
  });

  describe('addAlternative()', () => {
    it('should add an alternative branch', () => {
      const tree = builder.build(mockTrace);
      const alt = builder.addAlternative(tree, 'Do not file', 0.3);

      expect(alt.type).toBe('alternative');
      expect(alt.label).toBe('Do not file');
      expect(tree.children).toContain(alt);
    });
  });

  describe('flatten()', () => {
    it('should return all nodes in a flat array', () => {
      const tree = builder.build(mockTrace);
      const flat = builder.flatten(tree);
      expect(flat.length).toBeGreaterThan(3);
      expect(flat[0]).toBe(tree);
    });
  });

  describe('stats()', () => {
    it('should compute tree statistics', () => {
      const tree = builder.build(mockTrace);
      const s = builder.stats(tree);

      expect(s.depth).toBeGreaterThan(0);
      expect(s.nodeCount).toBeGreaterThan(3);
      expect(s.evidenceCount).toBeGreaterThan(0);
    });

    it('should count alternatives', () => {
      const tree = builder.build(mockTrace);
      builder.addAlternative(tree, 'Alt 1', 0.2);
      builder.addAlternative(tree, 'Alt 2', 0.1);
      const s = builder.stats(tree);
      expect(s.alternativeCount).toBe(2);
    });
  });
});
