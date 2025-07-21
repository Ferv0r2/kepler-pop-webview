'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Gem } from 'lucide-react';
import { useState } from 'react';

import { LoadingSpinner } from '@/components/logic/loading/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useTechTree } from '@/hooks/useTechTree';
import { useRouter } from '@/i18n/routing';
import type { TechTreeCategory, TechTreeNode } from '@/types/tech-tree-types';

import { TechNodeModal } from './components/TechNodeModal';
import { TechTreeFilters } from './components/TechTreeFilters';
import { TechTreeGrid } from './components/TechTreeGrid';

export const TechTreeView = () => {
  const router = useRouter();
  const { techTreeState, isLoading, error } = useTechTree();

  const [selectedCategory, setSelectedCategory] = useState<TechTreeCategory | 'all'>('all');
  const [selectedNode, setSelectedNode] = useState<TechTreeNode | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
        <LoadingSpinner text="테크 트리 로딩 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-bold text-white mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-400 mb-6">테크 트리를 불러올 수 없습니다.</p>
          <Button onClick={() => router.back()}>돌아가기</Button>
        </div>
      </div>
    );
  }

  const filteredNodes =
    selectedCategory === 'all'
      ? techTreeState.allNodes
      : techTreeState.allNodes.filter((node) => node.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155]">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              type="button"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">테크 트리</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* 스킬 포인트 */}
            <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-400/30">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-yellow-400 font-semibold">{techTreeState.userSkillPoints}</span>
            </div>

            {/* 젬 */}
            <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-400/30">
              <Gem size={16} className="text-purple-400" />
              <span className="text-purple-400 font-semibold">{techTreeState.userGems.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-4 pb-20">
        {/* 설명 */}
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-gray-300 max-w-lg mx-auto">영구 강화로 게임을 더 강력하게 만드세요!</p>
        </motion.div>

        {/* 필터 */}
        <TechTreeFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

        {/* 테크 트리 그리드 */}
        <TechTreeGrid nodes={filteredNodes} userNodes={techTreeState.userNodes} onNodeClick={setSelectedNode} />
      </main>

      {/* 노드 상세 모달 */}
      {selectedNode && (
        <TechNodeModal
          node={selectedNode}
          userNode={techTreeState.userNodes.find((un) => un.nodeId === selectedNode.id)}
          userGems={techTreeState.userGems}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};
