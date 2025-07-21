import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getLevelInfo, updateExperience } from '@/networks/KeplerBackend';
import type { GameMode } from '@/types/game-types';

import { useUser } from './useUser';

export const useLevel = () => {
  const { data: userInfo } = useUser();
  const queryClient = useQueryClient();

  const levelInfoQuery = useQuery({
    queryKey: ['level-info', userInfo?.id],
    queryFn: getLevelInfo,
    enabled: !!userInfo?.id,
    staleTime: 30 * 1000, // 30초
  });

  const updateExpMutation = useMutation({
    mutationFn: ({ score, mode }: { score: number; mode: GameMode }) => updateExperience(score, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['level-info'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    levelInfo: levelInfoQuery.data,
    isLoading: levelInfoQuery.isLoading,
    error: levelInfoQuery.error,
    updateExp: updateExpMutation.mutate,
    updateExpAsync: updateExpMutation.mutateAsync,
    isUpdating: updateExpMutation.isPending,
  };
};
