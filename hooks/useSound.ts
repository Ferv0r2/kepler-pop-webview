import { useState, useEffect, useCallback } from 'react';

import { getSoundSettings, saveSoundSettings, type SoundSettings } from '@/utils/sound-helper';

/**
 * 효과음 설정을 관리하는 커스텀 훅
 */
export const useSound = () => {
  const [settings, setSettings] = useState<SoundSettings>(() => getSoundSettings());

  // 설정이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveSoundSettings(settings);
  }, [settings]);

  // 효과음 활성화/비활성화 토글
  const toggleSound = useCallback(() => {
    setSettings((prev: SoundSettings) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  // 볼륨 변경
  const setVolume = useCallback((volume: number) => {
    setSettings((prev: SoundSettings) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  // 효과음 활성화
  const enableSound = useCallback(() => {
    setSettings((prev: SoundSettings) => ({ ...prev, enabled: true }));
  }, []);

  // 효과음 비활성화
  const disableSound = useCallback(() => {
    setSettings((prev: SoundSettings) => ({ ...prev, enabled: false }));
  }, []);

  return {
    settings,
    toggleSound,
    setVolume,
    enableSound,
    disableSound,
  };
};
