import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { lottiePreloader } from '@/utils/lottie-preloader';

interface LottieConfettiProps {
  trigger?: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
  autoHide?: boolean;
}

export const LottieConfetti: React.FC<LottieConfettiProps> = ({
  trigger = false,
  position = { x: 0.5, y: 0.5 },
  onComplete,
  size = 'medium',
  autoHide = true,
}) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationData, setAnimationData] = useState<unknown>(null);

  const sizeConfig = {
    small: { width: 200, height: 200 },
    medium: { width: 400, height: 400 },
    large: { width: 600, height: 600 },
  };

  // 미리 로드된 애니메이션 데이터 사용
  useEffect(() => {
    const data = lottiePreloader.getAnimation('confetti');
    if (data) {
      setAnimationData(data);
    } else {
      // 아직 로드되지 않은 경우 폴백
      console.warn('Confetti animation not preloaded, loading now...');
      lottiePreloader
        .preloadAnimation('confetti', '/animations/confetti.json')
        .then((loadedData) => {
          setAnimationData(loadedData);
        })
        .catch((error) => {
          console.error('Failed to load confetti animation:', error);
        });
    }
  }, []);

  useEffect(() => {
    if (trigger && animationData) {
      setIsVisible(true);
      lottieRef.current?.play();

      if (autoHide) {
        // 애니메이션 완료 후 자동으로 숨김
        const timer = setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 2000); // Lottie 애니메이션 기본 길이

        return () => clearTimeout(timer);
      }
    }
  }, [trigger, animationData, autoHide, onComplete]);

  if (!isVisible || !animationData) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 lottie-confetti-container"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        ...sizeConfig[size],
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
        onComplete={() => {
          if (autoHide) {
            setIsVisible(false);
          }
          onComplete?.();
        }}
        className="lottie-animation"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

// 다중 confetti 효과를 위한 매니저 컴포넌트
interface ConfettiManagerProps {
  children: React.ReactNode;
}

interface ConfettiEffect {
  id: string;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  timestamp: number;
}

export const ConfettiManager: React.FC<ConfettiManagerProps> = ({ children }) => {
  const [effects, setEffects] = useState<ConfettiEffect[]>([]);
  const counterRef = useRef(0);
  const maxConcurrentEffects = 8; // 동시 최대 confetti 수 제한
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingEffectsRef = useRef<ConfettiEffect[]>([]);

  const processBatch = () => {
    if (pendingEffectsRef.current.length === 0) return;

    setEffects((prev) => {
      const newEffects = [...prev, ...pendingEffectsRef.current];
      pendingEffectsRef.current = []; // 배치 초기화

      // 최대 동시 효과 수 제한으로 성능 보호
      if (newEffects.length > maxConcurrentEffects) {
        return newEffects.slice(-maxConcurrentEffects);
      }
      return newEffects;
    });

    batchTimerRef.current = null;
  };

  const addConfetti = useCallback(
    (position: { x: number; y: number }, size: 'small' | 'medium' | 'large' = 'medium') => {
      // 고유한 ID 생성: timestamp + 증가 카운터 + 랜덤값
      const uniqueId = `${Date.now()}-${++counterRef.current}-${Math.random().toString(36).substr(2, 9)}`;

      const newEffect: ConfettiEffect = {
        id: uniqueId,
        position,
        size,
        timestamp: Date.now(),
      };

      // 연쇄매칭을 위한 배치 처리 (16ms 내 들어오는 요청들을 묶어서 처리)
      pendingEffectsRef.current.push(newEffect);

      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }

      batchTimerRef.current = setTimeout(processBatch, 16); // 1프레임 시간
    },
    [],
  );

  const removeConfetti = (id: string) => {
    setEffects((prev) => prev.filter((effect) => effect.id !== id));
  };

  // 전역적으로 사용할 수 있도록 window 객체에 함수 등록 및 cleanup
  useEffect(() => {
    (window as Window & { addLottieConfetti?: typeof addConfetti }).addLottieConfetti = addConfetti;
    return () => {
      // 컴포넌트 언마운트 시 cleanup
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      pendingEffectsRef.current = [];
      delete (window as Window & { addLottieConfetti?: typeof addConfetti }).addLottieConfetti;
    };
  }, [addConfetti]);

  return (
    <>
      {children}
      {effects.map((effect) => (
        <LottieConfetti
          key={effect.id}
          trigger={true}
          position={effect.position}
          size={effect.size}
          onComplete={() => removeConfetti(effect.id)}
          autoHide={true}
        />
      ))}
    </>
  );
};
