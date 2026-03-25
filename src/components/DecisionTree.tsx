/**
 * @module DecisionTree
 * @description Interactive tree visualization of the reasoning process.
 * Allows users to explore each decision point and its supporting evidence.
 */

import React, { useState } from 'react';
import type { DecisionNode } from '../types';

export interface DecisionTreeProps {
  root: DecisionNode;
  onNodeClick?: (node: DecisionNode) => void;
}

/**
 * DecisionTree renders an interactive reasoning tree.
 */
export const DecisionTree: React.FC<DecisionTreeProps> = ({ root, onNodeClick }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([root.id]));

  const toggleNode = (nodeId: string) => {
    const next = new Set(expandedNodes);
    if (next.has(nodeId)) next.delete(nodeId);
    else next.add(nodeId);
    setExpandedNodes(next);
  };

  const renderNode = (node: DecisionNode, depth: number): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className={`tree-node type-${node.type}`} style={{ marginLeft: depth * 24 }}>
        <div className="node-header" onClick={() => { toggleNode(node.id); onNodeClick?.(node); }}>
          {hasChildren && <span className="toggle">{isExpanded ? '[-]' : '[+]'}</span>}
          <span className="label">{node.label}</span>
          <span className="confidence">{Math.round(node.confidence * 100)}%</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="node-children">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return <div className="decision-tree">{renderNode(root, 0)}</div>;
};
