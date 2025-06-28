import { useQuery } from '@tanstack/react-query';

import { getUserInfo, getDropletStatus } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';

export function useUser() {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['user'],
    queryFn: getUserInfo,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDropletStatus() {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['droplet-status'],
    queryFn: getDropletStatus,
    enabled: !!accessToken,
    staleTime: 1000 * 30, // 30초마다 갱신
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
  });
}
