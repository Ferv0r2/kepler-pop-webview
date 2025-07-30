import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getLevelInfo, updateExperience } from '@/networks/KeplerBackend';
import type { LevelInfo, LevelUpdateResponse, UpdateExpRequest } from '@/types/level-types';

export const useLevel = () => {
  return useQuery<LevelInfo>({
    queryKey: ['level'],
    queryFn: getLevelInfo,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });
};

export const useUpdateExperience = () => {
  const queryClient = useQueryClient();

  return useMutation<LevelUpdateResponse, Error, UpdateExpRequest>({
    mutationFn: updateExperience,
    onSuccess: (data) => {
      // 레벨 정보 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['level'] });
      // 사용자 정보 캐시도 무효화 (UserInfo에 레벨 정보 포함)
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // 레벨업한 경우 추가 처리 가능
      if (data.leveledUp) {
        console.log(`🎉 레벨업! 새 레벨: ${data.newLevel}, 스킬포인트 획득: ${data.skillPointsGained}`);
      }
    },
    onError: (error) => {
      console.error('경험치 업데이트 실패:', error);
    },
  });
};
