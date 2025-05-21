import { useQuery } from '@tanstack/react-query';

import { getUserInfo } from '@/networks/KeplerBackend';
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
