'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Zap, Loader2, Play, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export type LoadingType = 'default' | 'ad' | 'game' | 'save' | 'network';

interface ColorConfig {
  primary: string;
  secondary: string;
  glow: string;
}

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  type?: LoadingType;
  showProgress?: boolean;
  customIcon?: React.ReactNode;
}

// 타입별 기본 설정
const getTypeConfig = (type: LoadingType, t: ReturnType<typeof useTranslations>) => {
  switch (type) {
    case 'ad':
      return {
        title: t('loading.adWaiting'),
        subtitle: t('loading.adWaitingSubtitle'),
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        colors: {
          primary: 'blue',
          secondary: 'purple',
          glow: 'rgba(59,130,246,0.4)',
        },
      };
    case 'game':
      return {
        title: t('loading.gameStarting'),
        subtitle: t('loading.gameStartingSubtitle'),
        icon: <Play className="w-6 h-6 text-green-400" />,
        colors: {
          primary: 'green',
          secondary: 'emerald',
          glow: 'rgba(34,197,94,0.4)',
        },
      };
    case 'save':
      return {
        title: t('loading.saving'),
        subtitle: t('loading.savingSubtitle'),
        icon: <Shield className="w-6 h-6 text-blue-400" />,
        colors: {
          primary: 'blue',
          secondary: 'cyan',
          glow: 'rgba(59,130,246,0.4)',
        },
      };
    case 'network':
      return {
        title: t('loading.connecting'),
        subtitle: t('loading.connectingSubtitle'),
        icon: <Loader2 className="w-6 h-6 text-orange-400" />,
        colors: {
          primary: 'orange',
          secondary: 'amber',
          glow: 'rgba(249,115,22,0.4)',
        },
      };
    default:
      return {
        title: t('loading.pleaseWait'),
        subtitle: t('loading.processing'),
        icon: <Loader2 className="w-6 h-6 text-blue-400" />,
        colors: {
          primary: 'blue',
          secondary: 'purple',
          glow: 'rgba(59,130,246,0.4)',
        },
      };
  }
};

// 간소화된 별 필드 컴포넌트
const StarField = ({ count = 15 }: { count?: number }) => {
  const shouldReduceMotion = useReducedMotion();

  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      })),
    [count],
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 opacity-20">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: star.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 중앙 로딩 스피너 컴포넌트
const LoadingSpinner = ({ icon, colors }: { icon: React.ReactNode; colors: ColorConfig }) => {
  const shouldReduceMotion = useReducedMotion();
  const { primary, secondary } = colors;

  return (
    <div className="relative flex items-center justify-center">
      {/* 외부 회전 링 */}
      <motion.div
        className={`w-20 h-20 border-4 border-${primary}-500/30 border-t-${primary}-400 rounded-full`}
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {/* 내부 회전 링 */}
      <motion.div
        className={`absolute w-12 h-12 border-3 border-${secondary}-500/40 border-b-${secondary}-400 rounded-full`}
        animate={shouldReduceMotion ? {} : { rotate: -360 }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {/* 중앙 아이콘 */}
      <motion.div
        className="absolute flex items-center justify-center"
        animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1] }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        {icon}
      </motion.div>
    </div>
  );
};

// 진행 표시 펄스 효과
const ProgressPulse = ({ colors, show = true }: { colors: ColorConfig; show?: boolean }) => {
  const shouldReduceMotion = useReducedMotion();
  const { primary, secondary } = colors;

  if (!show) return null;

  return (
    <div className="flex justify-center gap-3 mt-6">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`w-2 h-2 rounded-full bg-gradient-to-r from-${primary}-400 to-${secondary}-400`}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }
          }
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: index * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export const LoadingModal = ({
  isOpen,
  title,
  subtitle,
  type = 'default',
  showProgress = true,
  customIcon,
}: LoadingModalProps) => {
  const t = useTranslations();
  const shouldReduceMotion = useReducedMotion();

  const config = getTypeConfig(type, t);
  const finalTitle = title || config.title;
  const finalSubtitle = subtitle || config.subtitle;
  const finalIcon = customIcon || config.icon;
  const colors = config.colors;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 배경 오버레이 */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md"
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(8px)' }}
            exit={{ backdropFilter: 'blur(0px)' }}
          >
            <StarField count={shouldReduceMotion ? 8 : 15} />
          </motion.div>

          {/* 메인 모달 */}
          <motion.div
            className={`relative bg-gradient-to-br from-slate-900/95 via-${colors.primary}-900/90 to-slate-900/95 rounded-3xl p-8 w-full max-w-sm border border-${colors.primary}-400/30 backdrop-blur-xl`}
            style={{
              boxShadow: `0 0 30px ${colors.glow}`,
            }}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              duration: 0.4,
            }}
          >
            {/* 장식용 회전 링 */}
            {!shouldReduceMotion && (
              <div className="absolute -inset-4 opacity-10 pointer-events-none">
                <motion.div
                  className="absolute inset-0 rounded-full border border-white/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border border-white/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                />
              </div>
            )}

            {/* 컨텐츠 영역 */}
            <div className="relative z-10 text-center space-y-6">
              {/* 로딩 스피너 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <LoadingSpinner icon={finalIcon} colors={colors} />
              </motion.div>

              {/* 메시지 텍스트 */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h3
                  className={`text-xl font-bold bg-gradient-to-r from-white via-${colors.primary}-100 to-${colors.secondary}-100 bg-clip-text text-transparent`}
                >
                  {finalTitle}
                </h3>

                {finalSubtitle && <p className="text-white/70 text-sm leading-relaxed">{finalSubtitle}</p>}
              </motion.div>

              {/* 진행 표시 */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                <ProgressPulse colors={colors} show={showProgress} />
              </motion.div>
            </div>

            {/* 글로우 효과 */}
            <div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-t from-${colors.primary}-500/5 to-transparent pointer-events-none`}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 기존 AdLoadingModal과의 호환성을 위한 래퍼
export const AdLoadingModal = ({ isOpen, message }: { isOpen: boolean; message?: string }) => {
  return <LoadingModal isOpen={isOpen} title={message} type="ad" />;
};
