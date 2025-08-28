'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { Artifact } from '@/types/game-types';

interface ArtifactPanelProps {
  artifacts: Artifact[];
  currentTurn?: number;
  gameState?: {
    moveCount: number;
    combo: number;
    score: number;
  };
  triggeredArtifacts?: Set<string>;
  showTriggeredEffects?: boolean;
}

export const ArtifactPanel = ({
  artifacts,
  currentTurn = 0,
  gameState,
  triggeredArtifacts = new Set(),
  showTriggeredEffects = false,
}: ArtifactPanelProps) => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);

  if (artifacts.length === 0) return null;

  return (
    <motion.div
      className="fixed right-4 top-16 z-20"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 토글 버튼 */}
      <motion.button
        className="bg-slate-800/90 backdrop-blur-sm rounded-full p-3 border border-yellow-500/30 shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center justify-center w-5 h-5 text-yellow-400 text-xl">🏺</div>
        {artifacts.length > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            {artifacts.length}
          </motion.div>
        )}
      </motion.button>

      {/* 유물 목록 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute right-0 top-12 bg-slate-800/95 backdrop-blur-sm rounded-xl p-3 border border-yellow-500/30 shadow-xl min-w-64"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: 'spring' }}
          >
            <div className="text-center mb-3">
              <div className="text-yellow-400 font-bold text-sm">{t('game.artifactPanel.title')}</div>
              <div className="text-white/60 text-xs">
                {t('game.artifactPanel.subtitle', {
                  count: artifacts.length,
                  active: artifacts.filter((a) => a.isActive).length,
                })}
              </div>
              {currentTurn > 0 && <div className="text-cyan-300 text-xs mt-1">🕒 턴 {currentTurn}</div>}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden">
              {artifacts.map((artifact, index) => {
                const isTriggered = triggeredArtifacts.has(artifact.id);
                const shouldGlow = isTriggered && showTriggeredEffects;

                return (
                  <motion.div
                    key={artifact.id}
                    className={`relative p-3 rounded-lg border transition-all duration-200 ${
                      shouldGlow
                        ? 'border-yellow-300 bg-yellow-500/20 shadow-lg shadow-yellow-500/30'
                        : hoveredArtifact === artifact.id
                          ? getRarityBorderHover(artifact.rarity || 'common')
                          : getRarityBorder(artifact.rarity || 'common')
                    } ${!artifact.isActive ? 'opacity-60' : ''}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: shouldGlow ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      delay: index * 0.1,
                      scale: { duration: 0.6, repeat: shouldGlow ? 3 : 0 },
                    }}
                    onMouseEnter={() => setHoveredArtifact(artifact.id)}
                    onMouseLeave={() => setHoveredArtifact(null)}
                  >
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className={`text-2xl ${artifact.color} ${shouldGlow ? 'drop-shadow-[0_0_8px_rgba(255,255,0,0.8)]' : ''}`}
                        animate={
                          shouldGlow
                            ? { rotate: [0, 360], scale: [1, 1.3, 1] }
                            : hoveredArtifact === artifact.id
                              ? { rotate: [0, 5, -5, 0] }
                              : {}
                        }
                        transition={{
                          duration: shouldGlow ? 0.8 : 0.5,
                          repeat: shouldGlow ? 2 : hoveredArtifact === artifact.id ? Infinity : 0,
                        }}
                      >
                        {artifact.icon}
                        {shouldGlow && (
                          <motion.div
                            className="absolute -top-2 -right-2 text-yellow-300 text-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.5, 1] }}
                            transition={{ duration: 0.5 }}
                          >
                            ✨
                          </motion.div>
                        )}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className={`font-bold text-sm ${artifact.color} truncate`}>
                            {t(`artifact.${artifact.id}`)}
                          </div>
                          <div
                            className={`text-xs px-1.5 py-0.5 rounded ${getRarityBadge(artifact.rarity || 'common')}`}
                          >
                            {getRarityText(artifact.rarity || 'common')}
                          </div>
                        </div>
                        <div className="text-white/70 text-xs mt-1 leading-tight">
                          {t(`artifact.${artifact.id}_description`)}
                        </div>
                        {renderArtifactStatus(artifact, currentTurn, gameState)}
                      </div>
                    </div>

                    {/* 활성 상태 및 특수 상태 표시 */}
                    {artifact.isActive && (
                      <motion.div
                        className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    {renderSpecialIndicators(artifact, currentTurn)}

                    {/* 호버 시 추가 정보 */}
                    <AnimatePresence>
                      {hoveredArtifact === artifact.id && (
                        <motion.div
                          className="absolute left-full ml-2 top-0 bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-600 shadow-xl min-w-48 z-50"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={`font-bold text-sm ${artifact.color} mb-1`}>{artifact.name}</div>
                          <div className="text-white/80 text-xs leading-relaxed mb-2">{artifact.description}</div>
                          {renderDetailedInfo(artifact, currentTurn, gameState)}
                          <div className="text-yellow-400 text-xs mt-2 font-medium">
                            {t('game.artifactPanel.rarity')}: {getRarityText(artifact.rarity || 'common')}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* 닫기 버튼 */}
            <motion.button
              className="w-full mt-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg text-white/70 text-sm transition-colors"
              onClick={() => setIsExpanded(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('common.close')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // 희귀도별 테두리 스타일
  function getRarityBorder(rarity: string) {
    switch (rarity) {
      case 'rare':
        return 'border-blue-500/50 bg-blue-900/20';
      case 'epic':
        return 'border-purple-500/50 bg-purple-900/20';
      case 'legendary':
        return 'border-orange-500/50 bg-orange-900/20';
      default:
        return 'border-slate-600 bg-slate-700/50';
    }
  }

  function getRarityBorderHover(rarity: string) {
    switch (rarity) {
      case 'rare':
        return 'border-blue-400/70 bg-blue-800/30';
      case 'epic':
        return 'border-purple-400/70 bg-purple-800/30';
      case 'legendary':
        return 'border-orange-400/70 bg-orange-800/30';
      default:
        return 'border-yellow-400/50 bg-yellow-400/10';
    }
  }

  function getRarityBadge(rarity: string) {
    switch (rarity) {
      case 'rare':
        return 'bg-blue-500/20 text-blue-300';
      case 'epic':
        return 'bg-purple-500/20 text-purple-300';
      case 'legendary':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  }

  function getRarityText(rarity: string) {
    switch (rarity) {
      case 'rare':
        return t('game.rarity.rare');
      case 'epic':
        return t('game.rarity.epic');
      case 'legendary':
        return t('game.rarity.legendary');
      default:
        return t('game.rarity.common');
    }
  }

  // 아티팩트 상태 렌더링
  function renderArtifactStatus(artifact: Artifact, turn: number, gameState?: any) {
    const statuses = [];

    // 턴 기반 효과 (turn_based와 auto_remove 모두 처리)
    const triggerTurn = artifact.effect.triggerTurn || artifact.effect.value;
    if ((artifact.effect.type === 'turn_based' || artifact.effect.type === 'auto_remove') && triggerTurn) {
      const turnsUntilNext = triggerTurn - (turn % triggerTurn);
      const actualTurnsLeft = turnsUntilNext === triggerTurn ? 0 : turnsUntilNext;

      if (actualTurnsLeft === 0) {
        statuses.push(
          <div key="turn" className="text-green-300 text-xs mt-1">
            ✨ 이번 턴 발동!
          </div>,
        );
      } else {
        statuses.push(
          <div key="turn" className="text-blue-300 text-xs mt-1">
            ⏰ {actualTurnsLeft}턴 후 발동
          </div>,
        );
      }
    }

    // 일회용 효과 사용 횟수
    if (artifact.effect.type === 'one_time' && artifact.effect.usesRemaining !== undefined) {
      statuses.push(
        <div key="uses" className="text-orange-300 text-xs mt-1">
          💎 {artifact.effect.usesRemaining}회 남음
        </div>,
      );
    }

    // 확률 기반 효과
    if (artifact.effect.type === 'probability_modifier' && artifact.effect.probability) {
      statuses.push(
        <div key="prob" className="text-green-300 text-xs mt-1">
          🎲 {artifact.effect.probability}% 확률
        </div>,
      );
    }

    // 이동 수정자 상태
    if (artifact.effect.type === 'movement_modifier' && gameState) {
      const condition = artifact.effect.condition;
      let statusText = '';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (condition === 'move_below_5' && gameState && 'moveCount' in gameState && gameState.moveCount <= 5) {
        statusText = '⚡ 효과 활성화 중';
      } else if (
        condition === 'every_10_moves' &&
        gameState &&
        'moveCount' in gameState &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        gameState.moveCount % 10 === 0
      ) {
        statusText = '🔄 다음 이동 무료';
      }

      if (statusText) {
        statuses.push(
          <div key="movement" className="text-cyan-300 text-xs mt-1">
            {statusText}
          </div>,
        );
      }
    }

    return statuses.length > 0 ? <div className="mt-1">{statuses}</div> : null;
  }

  // 특수 상태 표시기
  function renderSpecialIndicators(artifact: Artifact, turn: number) {
    const indicators = [];

    // 턴 기반 아티팩트 준비 상태 (turn_based와 auto_remove 모두 처리)
    const triggerTurn = artifact.effect.triggerTurn || artifact.effect.value;
    if ((artifact.effect.type === 'turn_based' || artifact.effect.type === 'auto_remove') && triggerTurn) {
      const isReady = turn % triggerTurn === 0 && turn > 0;
      if (isReady) {
        indicators.push(
          <motion.div
            key="ready"
            className="absolute top-1 right-4 w-2 h-2 bg-cyan-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />,
        );
      }
    }

    // 효과 발동 중 표시
    if (artifact.effect.type === 'passive_bonus' && artifact.isActive) {
      indicators.push(
        <div key="passive" className="absolute -top-1 -right-1 text-xs">
          ✨
        </div>,
      );
    }

    return indicators;
  }

  // 상세 정보 렌더링 - 호버 시 툴팁에 표시되는 정보
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderDetailedInfo(artifact: Artifact, _turn: number, _gameState?: any) {
    const details = [];

    // 아티팩트 효과 값 해석 및 표시
    const { type, value, condition, triggerTurn } = artifact.effect;

    // 1. 효과 수치 정보
    if (value) {
      const valueInfo = getEffectValueText(type, value, condition);
      if (valueInfo) {
        details.push(
          <div key="value" className="text-green-300 text-xs mb-1">
            📈 {valueInfo}
          </div>,
        );
      }
    }

    // 2. 발동 조건 정보
    const conditionInfo = getEffectConditionText(type, condition, triggerTurn, artifact.effect.value);
    if (conditionInfo) {
      details.push(
        <div key="condition" className="text-blue-300 text-xs mb-1">
          🎯 {conditionInfo}
        </div>,
      );
    }

    return details.length > 0 ? <div className="border-t border-slate-600 pt-2 mt-2">{details}</div> : null;
  }

  // 효과 값 텍스트 생성 헬퍼 함수
  function getEffectValueText(type: string, value: number, _condition?: string): string {
    switch (type) {
      case 'score_boost':
        return `점수 ${value * 100}% 증가`;
      case 'probability_modifier':
        return `${value * 100}% 확률`;
      case 'movement_modifier':
        return `이동 +${value}`;
      case 'item_enhancement':
        return `효과 ${value * 100}% 강화`;
      case 'cost_reduction':
        return `비용 ${value}회 감소`;
      case 'combo_boost':
        return `추가 이동 +${value}`;
      case 'auto_remove':
        return `${value}턴마다 자동 제거`;
      case 'turn_based':
        return `${value}배 효과`;
      default:
        return `효과 값: ${value}`;
    }
  }

  // 발동 조건 텍스트 생성 헬퍼 함수
  function getEffectConditionText(type: string, condition?: string, triggerTurn?: number, value?: number): string {
    // 턴 기반 효과들의 발동 조건
    if (type === 'turn_based' && triggerTurn) {
      return `${triggerTurn}턴마다 발동`;
    }
    if (type === 'auto_remove' && value) {
      return `${value}턴마다 발동`;
    }

    // 조건부 효과들
    if (!condition) return '';

    if (condition.includes('combo')) return '콤보 달성 시 발동';
    if (condition.includes('match')) return '매치 시 발동';
    if (condition.includes('tier_upgrade')) return '타일 매치 시 발동';
    if (condition.includes('bomb')) return '폭탄 사용 시 발동';
    if (condition.includes('item')) return '아이템 사용 시 발동';

    return '특수 조건부 발동';
  }
};
