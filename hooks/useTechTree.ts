import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchTechTreeNodes, fetchMyTechTree, purchaseTechNode } from '@/networks/KeplerBackend';
import type { TechTreeState } from '@/types/tech-tree-types';

import { useUser } from './useUser';

export const useTechTree = () => {
  const { data: userInfo } = useUser();
  const queryClient = useQueryClient();

  const allNodesQuery = useQuery({
    queryKey: ['tech-tree-nodes'],
    queryFn: fetchTechTreeNodes,
    staleTime: 5 * 60 * 1000, // 5분
  });

  const userNodesQuery = useQuery({
    queryKey: ['user-tech-tree', userInfo?.id],
    queryFn: fetchMyTechTree,
    enabled: !!userInfo?.id,
    staleTime: 30 * 1000, // 30초
  });

  const purchaseMutation = useMutation({
    mutationFn: purchaseTechNode,
    onSuccess: () => {
      // 사용자 테크 트리와 유저 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['user-tech-tree'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const techTreeState: TechTreeState = {
    allNodes: allNodesQuery.data || [],
    userNodes: userNodesQuery.data || [],
    userSkillPoints: userInfo?.skillPoints || 0,
    userGems: userInfo?.gem || 0,
  };

  return {
    techTreeState,
    isLoading: allNodesQuery.isLoading || userNodesQuery.isLoading,
    error: allNodesQuery.error || userNodesQuery.error,
    purchaseNode: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
  };
};
