/**
 * @module VisualTreeRenderer
 * @description Renders reasoning decision trees into formats suitable for
 * UI visualization (JSON for React tree components, Mermaid for docs).
 */

import type { DecisionNode } from '../types';

/** Output format for tree rendering */
export type TreeFormat = 'json' | 'mermaid' | 'text';

/**
 * VisualTreeRenderer converts decision tree structures into
 * renderable output formats.
 */
export class VisualTreeRenderer {
  /**
   * Render a decision tree to the specified format.
   * @param root - The root decision node
   * @param format - Output format
   * @returns Rendered tree as a string
   */
  render(root: DecisionNode, format: TreeFormat = 'mermaid'): string {
    switch (format) {
      case 'mermaid':
        return this.toMermaid(root);
      case 'text':
        return this.toText(root, 0);
      case 'json':
      default:
        return JSON.stringify(root, null, 2);
    }
  }

  /**
   * Render as a Mermaid flowchart.
   */
  private toMermaid(root: DecisionNode): string {
    const lines: string[] = ['flowchart TB'];
    const queue = [root];
    let counter = 0;
    const idMap = new Map<string, string>();

    while (queue.length > 0) {
      const node = queue.shift()!;
      const nodeId = `n${counter++}`;
      idMap.set(node.id, nodeId);

      const label = this.escapeLabel(node.label);
      const shape =
        node.type === 'root' ? `[${label}]` :
        node.type === 'conclusion' ? `{{${label}}}` :
        node.type === 'evidence' ? `[(${label})]` :
        node.type === 'alternative' ? `>|${label}|` :
        `(${label})`;

      lines.push(`    ${nodeId}${shape}`);

      if (node.parentId && idMap.has(node.parentId)) {
        lines.push(`    ${idMap.get(node.parentId)} --> ${nodeId}`);
      }

      queue.push(...node.children);
    }

    return lines.join('\n');
  }

  /**
   * Render as indented text.
   */
  private toText(node: DecisionNode, depth: number): string {
    const indent = '  '.repeat(depth);
    const prefix =
      node.type === 'root' ? '[Q]' :
      node.type === 'conclusion' ? '[C]' :
      node.type === 'evidence' ? '[E]' :
      node.type === 'alternative' ? '[A]' :
      '[I]';

    let text = `${indent}${prefix} ${node.label} (${Math.round(node.confidence * 100)}%)\n`;
    for (const child of node.children) {
      text += this.toText(child, depth + 1);
    }
    return text;
  }

  private escapeLabel(label: string): string {
    return label.replace(/"/g, "'").substring(0, 60);
  }
}
