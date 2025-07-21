'use client';

import { createContext, useContext, ReactNode } from 'react';

import { useGlobalPreloader } from '@/hooks/useGlobalPreloader';

interface PreloadingState {
  isLoading: boolean;
  progress: number;
  loadedCount: number;
  totalCount: number;
  isComplete: boolean;
}

interface GlobalPreloadContextType {
  preloadingState: PreloadingState;
}

const GlobalPreloadContext = createContext<GlobalPreloadContextType | undefined>(undefined);

interface GlobalPreloadProviderProps {
  children: ReactNode;
}

/**
 * 전역 이미지 프리로딩을 관리하는 프로바이더
 */
export const GlobalPreloadProvider = ({ children }: GlobalPreloadProviderProps) => {
  const preloadingState = useGlobalPreloader();

  return <GlobalPreloadContext.Provider value={{ preloadingState }}>{children}</GlobalPreloadContext.Provider>;
};

/**
 * 전역 프리로딩 상태를 사용하는 훅
 */
export const useGlobalPreload = (): GlobalPreloadContextType => {
  const context = useContext(GlobalPreloadContext);

  if (context === undefined) {
    throw new Error('useGlobalPreload must be used within a GlobalPreloadProvider');
  }

  return context;
};
