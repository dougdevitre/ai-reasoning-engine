/**
 * @jest-environment node
 */

import { ReasoningTracer } from '../src/tracing/reasoning-tracer';
import type { ReasoningStepInput, Source } from '../src/types';

describe('ReasoningTracer', () => {
  let tracer: ReasoningTracer;

  const mockSource: Source = {
    id: 'src_1',
    title: 'Family Code Section 3011',
    type: 'statute',
    qualityScore: 0.9,
  };

  const mockStepInput: ReasoningStepInput = {
    description: 'Identify custody factors',
    sources: [mockSource],
    method: 'source_analysis',
    result: 'Found 5 statutory factors',
  };

  beforeEach(() => {
    tracer = new ReasoningTracer();
  });

  describe('startTrace()', () => {
    it('should create a trace in started status', () => {
      const trace = tracer.startTrace('What are the custody factors?');
      expect(trace.id).toBeDefined();
      expect(trace.query).toBe('What are the custody factors?');
      expect(trace.status).toBe('started');
      expect(trace.steps).toHaveLength(0);
      expect(trace.startedAt).toBeDefined();
    });

    it('should store optional context', () => {
      const trace = tracer.startTrace('test', { jurisdiction: 'california' });
      expect(trace.context?.jurisdiction).toBe('california');
    });
  });

  describe('addStep()', () => {
    it('should add a step and update status to in_progress', () => {
      const trace = tracer.startTrace('test');
      const step = tracer.addStep(trace.id, mockStepInput);

      expect(step.id).toBeDefined();
      expect(step.traceId).toBe(trace.id);
      expect(step.stepNumber).toBe(1);
      expect(step.description).toBe('Identify custody factors');
      expect(step.sources).toHaveLength(1);
      expect(step.confidence).toBeGreaterThan(0);

      const updated = tracer.getTrace(trace.id);
      expect(updated.status).toBe('in_progress');
      expect(updated.steps).toHaveLength(1);
    });

    it('should increment step numbers', () => {
      const trace = tracer.startTrace('test');
      tracer.addStep(trace.id, mockStepInput);
      const step2 = tracer.addStep(trace.id, {
        ...mockStepInput,
        description: 'Second step',
      });
      expect(step2.stepNumber).toBe(2);
    });

    it('should throw when adding to a completed trace', () => {
      const trace = tracer.startTrace('test');
      tracer.addStep(trace.id, mockStepInput);
      tracer.complete(trace.id);

      expect(() => tracer.addStep(trace.id, mockStepInput)).toThrow(
        'Cannot add steps to completed trace'
      );
    });

    it('should compute higher confidence for more sources', () => {
      const trace = tracer.startTrace('test');

      const step1 = tracer.addStep(trace.id, {
        ...mockStepInput,
        sources: [mockSource],
      });

      const trace2 = tracer.startTrace('test2');
      const step2 = tracer.addStep(trace2.id, {
        ...mockStepInput,
        sources: [mockSource, { ...mockSource, id: 'src_2' }, { ...mockSource, id: 'src_3' }],
      });

      expect(step2.confidence).toBeGreaterThan(step1.confidence);
    });
  });

  describe('complete()', () => {
    it('should set status to completed with aggregate confidence', () => {
      const trace = tracer.startTrace('test');
      tracer.addStep(trace.id, mockStepInput);
      const completed = tracer.complete(trace.id);

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
      expect(completed.aggregateConfidence).toBeGreaterThan(0);
    });

    it('should throw if trace has no steps', () => {
      const trace = tracer.startTrace('test');
      expect(() => tracer.complete(trace.id)).toThrow('no steps');
    });
  });

  describe('fail()', () => {
    it('should set status to failed with reason', () => {
      const trace = tracer.startTrace('test');
      const failed = tracer.fail(trace.id, 'No relevant sources found');

      expect(failed.status).toBe('failed');
      expect(failed.completedAt).toBeDefined();
      expect(failed.context?.failureReason).toBe('No relevant sources found');
    });
  });

  describe('getSources()', () => {
    it('should return deduplicated sources across steps', () => {
      const trace = tracer.startTrace('test');
      tracer.addStep(trace.id, { ...mockStepInput, sources: [mockSource] });
      tracer.addStep(trace.id, {
        ...mockStepInput,
        sources: [mockSource, { id: 'src_2', title: 'Other', type: 'case_law' }],
      });

      const sources = tracer.getSources(trace.id);
      expect(sources).toHaveLength(2);
    });
  });

  describe('listTraces()', () => {
    it('should filter by status', () => {
      tracer.startTrace('test1');
      const t2 = tracer.startTrace('test2');
      tracer.addStep(t2.id, mockStepInput);
      tracer.complete(t2.id);

      const started = tracer.listTraces('started');
      expect(started).toHaveLength(1);

      const completed = tracer.listTraces('completed');
      expect(completed).toHaveLength(1);
    });
  });
});
