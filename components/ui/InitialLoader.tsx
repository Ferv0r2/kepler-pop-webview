'use client';
import { useEffect } from 'react';

/**
 * SSR에서 렌더된 #initial-loader를 hydration 후 페이드아웃 및 제거하는 역할만 담당
 */
export function InitialLoaderRemover() {
  useEffect(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 500);
    }
  }, []);
  return null;
}
