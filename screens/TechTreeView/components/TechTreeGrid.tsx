'use client';

import { motion } from 'framer-motion';

import type { TechTreeNode, UserTechTreeNode } from '@/types/tech-tree-types';

import { TechTreeNodeCard } from './TechTreeNodeCard';

interface TechTreeGridProps {
  nodes: TechTreeNode[];
  userNodes: UserTechTreeNode[];
  onNodeClick: (node: TechTreeNode) => void;
}

export const TechTreeGrid = ({ nodes, userNodes, onNodeClick }: TechTreeGridProps) => {
  // 카테고리별로 그룹화
  const groupedNodes = nodes.reduce(
    (acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    },
    {} as Record<string, TechTreeNode[]>,
  );

  // 각 카테고리를 티어별로 정렬
  Object.keys(groupedNodes).forEach((category) => {
    groupedNodes[category].sort((a, b) => a.tier - b.tier);
  });

  return (
    <div className="space-y-8">
      {Object.entries(groupedNodes).map(([category, categoryNodes]) => (
        <motion.div
          key={category}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Object.keys(groupedNodes).indexOf(category) * 0.1 }}
        >
          <h3 className="text-lg font-semibold text-white capitalize mb-4">{category}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryNodes.map((node, index) => {
              const userNode = userNodes.find((un) => un.nodeId === node.id);
              return (
                <TechTreeNodeCard
                  key={node.id}
                  node={node}
                  userNode={userNode}
                  onClick={() => onNodeClick(node)}
                  delay={index * 0.05}
                />
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
