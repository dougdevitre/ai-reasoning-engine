/**
 * @module DecisionTreeBuilder
 * @description Builds a visual decision tree from a reasoning trace.
 * Converts sequential steps into a hierarchical tree structure suitable
 * for interactive visualization.
 */

import { v4 as uuid } from 'uuid';
import type { ReasoningTrace, DecisionNode, NodeType } from '../types';

/**
 * DecisionTreeBuilder constructs a tree representation of the reasoning
 * process for visualization in the UI.
 *
 * @example
 * ```typescript
 * const builder = new DecisionTreeBuilder();
 * const tree = builder.build(trace);
 * console.log(tree.label); // Root query
 * console.log(tree.children); // Reasoning branches
 * ```
 */
export class DecisionTreeBuilder {
  /**
   * Build a decision tree from a completed reasoning trace.
   * The root node represents the query, and child nodes represent
   * reasoning steps and their conclusions.
   *
   * @param trace - The reasoning trace to convert
   * @returns Root node of the decision tree
   */
  build(trace: ReasoningTrace): DecisionNode {
    const root: DecisionNode = {
      id: uuid(),
      traceId: trace.id,
      parentId: null,
      label: trace.query,
      type: 'root',
      confidence: trace.aggregateConfidence ?? 0,
      children: [],
    };

    let currentParent = root;

    for (const step of trace.steps) {
      const stepNode: DecisionNode = {
        id: uuid(),
        traceId: trace.id,
        parentId: currentParent.id,
        label: step.description,
        type: this.inferNodeType(step, trace),
        confidence: step.confidence,
        children: [],
        metadata: {
          method: step.method,
          sourceCount: step.sources.length,
          stepNumber: step.stepNumber,
        },
      };

      // Add source nodes as children of this step
      for (const source of step.sources) {
        const sourceNode: DecisionNode = {
          id: uuid(),
          traceId: trace.id,
          parentId: stepNode.id,
          label: source.title,
          type: 'evidence',
          confidence: source.qualityScore ?? 0.5,
          children: [],
          metadata: {
            sourceType: source.type,
            url: source.url,
            jurisdiction: source.jurisdiction,
          },
        };
        stepNode.children.push(sourceNode);
      }

      currentParent.children.push(stepNode);

      // Last step becomes the conclusion
      if (step.stepNumber === trace.steps.length) {
        const conclusionNode: DecisionNode = {
          id: uuid(),
          traceId: trace.id,
          parentId: stepNode.id,
          label: step.result,
          type: 'conclusion',
          confidence: step.confidence,
          children: [],
        };
        stepNode.children.push(conclusionNode);
      }

      currentParent = stepNode;
    }

    return root;
  }

  /**
   * Add an alternative branch to an existing tree.
   * @param parent - The node to branch from
   * @param label - The alternative conclusion
   * @param confidence - Confidence in this alternative
   */
  addAlternative(
    parent: DecisionNode,
    label: string,
    confidence: number
  ): DecisionNode {
    const altNode: DecisionNode = {
      id: uuid(),
      traceId: parent.traceId,
      parentId: parent.id,
      label,
      type: 'alternative',
      confidence,
      children: [],
      metadata: { isAlternative: true },
    };
    parent.children.push(altNode);
    return altNode;
  }

  /**
   * Flatten a tree into an array of nodes for serialization.
   * @param root - The root node
   * @returns Flat array of all nodes
   */
  flatten(root: DecisionNode): DecisionNode[] {
    const nodes: DecisionNode[] = [];
    const queue = [root];

    while (queue.length > 0) {
      const node = queue.shift()!;
      nodes.push(node);
      queue.push(...node.children);
    }

    return nodes;
  }

  /**
   * Compute tree statistics (depth, breadth, source count).
   * @param root - The root node
   */
  stats(root: DecisionNode): {
    depth: number;
    nodeCount: number;
    evidenceCount: number;
    alternativeCount: number;
  } {
    let depth = 0;
    let nodeCount = 0;
    let evidenceCount = 0;
    let alternativeCount = 0;

    const traverse = (node: DecisionNode, currentDepth: number) => {
      nodeCount++;
      depth = Math.max(depth, currentDepth);
      if (node.type === 'evidence') evidenceCount++;
      if (node.type === 'alternative') alternativeCount++;
      for (const child of node.children) {
        traverse(child, currentDepth + 1);
      }
    };

    traverse(root, 0);

    return { depth, nodeCount, evidenceCount, alternativeCount };
  }

  /**
   * Infer the node type from step context.
   */
  private inferNodeType(
    step: import('../types').ReasoningStep,
    trace: ReasoningTrace
  ): NodeType {
    if (step.stepNumber === trace.steps.length) return 'conclusion';
    return 'inference';
  }
}
