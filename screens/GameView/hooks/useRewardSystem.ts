'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import {
  REWARD_THRESHOLDS,
  REWARD_SELECTION_TIMEOUT,
  REWARD_PROBABILITIES,
} from '@/screens/GameView/constants/game-config';
import type { Reward, RewardState, ArtifactId, GridItem, GameItem } from '@/types/game-types';

import { ARTIFACTS } from '../constants/artifacts';

export interface UseRewardSystemReturn {
  rewardState: RewardState;
  showRewardModal: boolean;
  availableRewards: Reward[];
  selectedReward: Reward | null;
  timeRemaining: number;
  selectReward: (reward: Reward) => void;
  checkScoreReward: (currentScore: number) => void;
  applyArtifactEffects: (
    grid: GridItem[][],
    combo: number,
    baseScore: number,
    turn?: number,
    matchCount?: number,
  ) => {
    grid: GridItem[][];
    combo: number;
    score: number;
  };
  // 새로운 유물 효과 함수들
  getMovementModifier: (currentMoves: number) => number;
  shouldTriggerTurnBasedEffect: (artifactId: ArtifactId, turn: number) => boolean;
  getProbabilityModifier: (baseChance: number, effectType: string) => number;
  getItemEnhancement: (itemType: string) => { enhanced: boolean; modifier: number };
  getShuffleCost: () => number;
  resetRewardState: () => void;
}

export const useRewardSystem = (gameItems: GameItem[]): UseRewardSystemReturn => {
  const t = useTranslations();
  const [rewardState, setRewardState] = useState<RewardState>({
    achievedScores: new Set(),
    activeArtifacts: [],
    rewardHistory: [],
  });
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // 보상 생성 함수
  const generateRewards = useCallback(
    (round: number): Reward[] => {
      const allRewards: Reward[] = [];

      // moves 보상: round * (1~5)
      for (let i = 1; i <= 5; i++) {
        allRewards.push({
          type: 'moves',
          id: `moves_${round}_${i}`,
          name: t('game.reward.moves_title', { count: round * i }),
          description: t('game.reward.moves_description', { count: round * i }),
          icon: '🚀',
          value: round * i,
          color: 'text-blue-400',
        });
      }

      // items 보상: 각 아이템별로 round * (1~2)
      gameItems.forEach((gameItem) => {
        for (let i = 1; i <= 2; i++) {
          allRewards.push({
            type: 'items',
            id: `items_${gameItem.id}_${round}_${i}`,
            name: t('game.reward.items_title', { name: t(`game.items.${gameItem.id}`), count: round * i }),
            description: t('game.reward.items_description', { name: t(`game.items.${gameItem.id}`), count: round * i }),
            icon: gameItem.icon,
            value: round * i,
            color: 'text-purple-400',
          });
        }
      });

      // gem 보상: round * (0~1), 최소 1개 보장
      for (let i = 0; i <= 1; i++) {
        const gemCount = Math.max(1, Math.floor(round * i)); // 최소 1개 보장
        allRewards.push({
          type: 'gem',
          id: `gem_${round}_${i}`,
          name: t('game.reward.gem_title', { count: gemCount }),
          description: t('game.reward.gem_description', { count: gemCount }),
          icon: '/icons/gem.png',
          value: gemCount,
          color: 'text-yellow-400',
        });
      }

      // 아직 획득하지 않은 유물만 풀에 추가
      const ownedArtifactIds = new Set(rewardState.activeArtifacts.map((a) => a.id));
      const artifactIds = (Object.keys(ARTIFACTS) as ArtifactId[]).filter((id) => !ownedArtifactIds.has(id));
      artifactIds.forEach((artifactId) => {
        const artifact = ARTIFACTS[artifactId];
        allRewards.push({
          type: 'artifact',
          id: `artifact_${artifactId}_${round}`,
          name: t(`artifact.${artifactId}`),
          description: t(`artifact.${artifactId}_description`),
          icon: artifact.icon,
          value: 1,
          color: artifact.color,
        });
      });

      // 전체 풀에서 3개 랜덤 선택 (중복 없이)
      const selectedRewards: Reward[] = [];
      const availableRewards = [...allRewards];

      for (let i = 0; i < 3 && availableRewards.length > 0; i++) {
        // 확률에 따른 가중치 적용
        const random = Math.random();
        let candidateRewards: Reward[] = [];

        // 확률 누적 계산
        const movesProb = REWARD_PROBABILITIES.moves;
        const itemsProb = REWARD_PROBABILITIES.items;
        const artifactProb = REWARD_PROBABILITIES.artifact;
        const gemProb = REWARD_PROBABILITIES.gem;

        if (random < movesProb) {
          // moves 타입 선택
          candidateRewards = availableRewards.filter((r) => r.type === 'moves');
        } else if (random < movesProb + itemsProb) {
          // items 타입 선택
          candidateRewards = availableRewards.filter((r) => r.type === 'items');
        } else if (random < movesProb + itemsProb + gemProb) {
          // gem 타입 선택
          candidateRewards = availableRewards.filter((r) => r.type === 'gem');
        } else if (random < movesProb + itemsProb + gemProb + artifactProb) {
          // artifact 타입 선택
          candidateRewards = availableRewards.filter((r) => r.type === 'artifact');
        } else {
          // 확률에 걸리지 않으면 전체에서 선택
          candidateRewards = availableRewards;
        }

        // 해당 타입의 보상이 없으면 전체에서 선택
        if (candidateRewards.length === 0) {
          candidateRewards = availableRewards;
        }

        // 후보 중에서 랜덤 선택
        const randomIndex = Math.floor(Math.random() * candidateRewards.length);
        const selectedReward = candidateRewards[randomIndex];

        selectedRewards.push(selectedReward);

        // 선택된 보상을 풀에서 제거 (중복 방지)
        const removeIndex = availableRewards.findIndex((r) => r.id === selectedReward.id);
        if (removeIndex !== -1) {
          availableRewards.splice(removeIndex, 1);
        }
      }

      return selectedRewards;
    },
    [gameItems, rewardState.activeArtifacts],
  );

  // 점수 보상 체크
  const checkScoreReward = useCallback(
    (currentScore: number) => {
      if (showRewardModal) return; // 이미 모달이 열려 있으면 중복 호출 방지
      const thresholdIndex = REWARD_THRESHOLDS.findIndex(
        (t) => currentScore >= t.score && !rewardState.achievedScores.has(t.score),
      );

      if (thresholdIndex !== -1) {
        const threshold = REWARD_THRESHOLDS[thresholdIndex];
        const round = thresholdIndex + 1;

        // 보상 모달을 열 때 즉시 achievedScores에 해당 점수 추가 (중복 방지)
        setRewardState((prev) => ({
          ...prev,
          achievedScores: new Set([...prev.achievedScores, threshold.score]),
        }));

        const rewards = generateRewards(round);
        setAvailableRewards(rewards);
        setShowRewardModal(true);
        setTimeRemaining(REWARD_SELECTION_TIMEOUT / 1000);
        setSelectedReward(null);
      }
    },
    [rewardState.achievedScores, generateRewards, showRewardModal],
  );

  // 보상 선택
  const selectReward = useCallback((reward: Reward) => {
    setSelectedReward(reward);

    // 보상 상태 업데이트
    setRewardState((prev) => {
      const newState = { ...prev };

      // reward.id에서 round 추출하여 해당 threshold 찾기
      let threshold;
      if (reward.type === 'moves') {
        const round = parseInt(reward.id.split('_')[1]);
        threshold = REWARD_THRESHOLDS[round - 1];
      } else if (reward.type === 'items') {
        const round = parseInt(reward.id.split('_')[2]);
        threshold = REWARD_THRESHOLDS[round - 1];
      } else if (reward.type === 'gem') {
        const round = parseInt(reward.id.split('_')[1]);
        threshold = REWARD_THRESHOLDS[round - 1];
      } else if (reward.type === 'artifact') {
        const round = parseInt(reward.id.split('_')[2]);
        threshold = REWARD_THRESHOLDS[round - 1];
      }

      // 보상 히스토리 추가
      newState.rewardHistory.push({
        score: threshold?.score || 0,
        selectedReward: reward,
        timestamp: new Date(),
      });

      // 유물 보상인 경우 활성 유물에 추가
      if (reward.type === 'artifact') {
        const idParts = reward.id.split('_');
        let artifactId: string | undefined;
        if (idParts[0] === 'artifact' && idParts.length >= 4) {
          artifactId = `${idParts[1]}_${idParts[2]}`;
        }
        const artifact = artifactId ? structuredClone(ARTIFACTS[artifactId as ArtifactId]) : undefined;
        if (artifact) {
          artifact.isActive = true;
          // 중복 방지: 이미 활성화된 유물인지 확인
          if (!newState.activeArtifacts.some((a) => a.id === artifact.id)) {
            newState.activeArtifacts.push(artifact);
          }
        }
      }

      return newState;
    });

    setShowRewardModal(false);
    setTimeRemaining(0);
  }, []);

  // 유물 효과 적용
  const applyArtifactEffects = useCallback(
    (grid: GridItem[][], combo: number, baseScore: number, turn?: number, matchCount?: number) => {
      const modifiedGrid = structuredClone(grid);
      let modifiedCombo = combo;
      let modifiedScore = baseScore;

      rewardState.activeArtifacts.forEach((artifact) => {
        if (!artifact.isActive) return;

        switch (artifact.effect.type) {
          case 'combo_boost':
            // Future: chain_reactor artifact would be implemented here
            modifiedCombo += artifact.effect.value;
            break;

          case 'score_boost': {
            let scoreMultiplier = 1;
            if (artifact.effect.condition === 'combo_5_plus' && combo >= 5) {
              // 별똥별 가속기: 콤보 5 이상일 때 점수 2배
              scoreMultiplier *= artifact.effect.value;
            } else if (artifact.effect.condition === 'match_5_plus' && (matchCount || 0) >= 5) {
              // 우주 공명기: 5개 이상 매치 시 점수 3배
              scoreMultiplier *= artifact.effect.value;
            } else if (!artifact.effect.condition) {
              // 기본 점수 부스트 (별빛 축전기, 쌍성 축전기)
              scoreMultiplier += artifact.effect.value;
            }
            modifiedScore = Math.floor(modifiedScore * scoreMultiplier);
            break;
          }

          case 'passive_bonus':
            if (artifact.effect.condition === 'combo_4' && combo === 4) {
              // 황금 수확기: 4연속 콤보 시 보너스 500점
              modifiedScore += artifact.effect.value;
            }
            break;

          case 'probability_modifier':
            if (artifact.effect.condition === 'gambling_score') {
              // 도박사의 동전: 50% 확률로 점수 0 또는 3배
              if (Math.random() < artifact.effect.value / 100) {
                modifiedScore = Math.random() < 0.5 ? 0 : modifiedScore * 3;
              }
            }
            break;

          case 'turn_based':
            if (turn && artifact.effect.condition === 'convert_max_tier' && turn % artifact.effect.triggerTurn! === 0) {
              // 크리스탈 변환기: 매 7턴마다 랜덤 타일 3개를 최고 등급으로 변환
              // 이 로직은 게임 로직에서 처리되어야 함
            }
            break;

          case 'auto_remove':
            // 자동 제거는 턴 기반으로 처리되므로 여기서는 스킵
            break;

          case 'special':
            if (artifact.effect.condition === 'tier_upgrade') {
              // 1등급 타일 승급 로직은 매치 처리 시 적용
              break;
            }
            break;
        }
      });

      return {
        grid: modifiedGrid,
        combo: modifiedCombo,
        score: modifiedScore,
      };
    },
    [rewardState.activeArtifacts],
  );

  // 섞기 비용 계산
  const BASE_SHUFFLE_COST = 5;
  const getShuffleCost = useCallback(() => {
    const costReduction = rewardState.activeArtifacts
      .filter((artifact) => artifact.isActive && artifact.effect.type === 'cost_reduction')
      .reduce((total, artifact) => total + artifact.effect.value, 0);

    return Math.max(1, BASE_SHUFFLE_COST - costReduction);
  }, [rewardState.activeArtifacts]);

  // 보상 상태 초기화
  const resetRewardState = useCallback(() => {
    setRewardState({
      achievedScores: new Set(),
      activeArtifacts: [],
      rewardHistory: [],
    });
    setShowRewardModal(false);
    setAvailableRewards([]);
    setSelectedReward(null);
    setTimeRemaining(0);
  }, []);

  // 타이머 효과
  useEffect(() => {
    if (showRewardModal && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // 시간 초과 시 첫 번째 보상 자동 선택
            if (availableRewards.length > 0) {
              selectReward(availableRewards[0]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showRewardModal, timeRemaining, availableRewards, selectReward]);

  // 이동 횟수 수정자 계산
  const getMovementModifier = useCallback(
    (currentMoves: number) => {
      let modifier = 0;

      rewardState.activeArtifacts.forEach((artifact) => {
        if (!artifact.isActive) return;

        if (artifact.effect.type === 'movement_modifier') {
          if (artifact.effect.condition === 'low_moves_5' && currentMoves <= 5) {
            // 긴급 충전기: 이동 횟수 5 이하일 때 +2
            modifier += artifact.effect.value;
          }
        }
      });

      return modifier;
    },
    [rewardState.activeArtifacts],
  );

  // 턴 기반 효과 발동 확인 - 유물을 얻은 턴 기준으로 계산
  const shouldTriggerTurnBasedEffect = useCallback(
    (artifactId: ArtifactId, turn: number) => {
      const artifact = rewardState.activeArtifacts.find((a) => a.id === artifactId && a.isActive);
      if (!artifact || artifact.effect.type !== 'turn_based') {
        return false;
      }

      const triggerTurn = artifact.effect.triggerTurn!;

      // 유물을 얻은 턴이 설정되어 있으면 해당 턴 기준으로 계산
      if (artifact.obtainedTurn && artifact.obtainedTurn > 0) {
        const turnsSinceObtained = turn - artifact.obtainedTurn;
        return turnsSinceObtained > 0 && turnsSinceObtained % triggerTurn === 0;
      } else {
        // 기존 방식: 단순히 현재 턴이 triggerTurn의 배수인지 확인
        return turn > 0 && turn % triggerTurn === 0;
      }
    },
    [rewardState.activeArtifacts],
  );

  // 확률 수정자 계산
  const getProbabilityModifier = useCallback(
    (baseChance: number, _effectType: string) => {
      let modifier = baseChance;

      rewardState.activeArtifacts.forEach((artifact) => {
        if (!artifact.isActive) return;

        if (artifact.effect.type === 'probability_modifier') {
          if (artifact.effect.condition === 'multiply_all_probabilities') {
            // 행운의 주사위: 모든 확률 2배
            modifier *= artifact.effect.value;
          }
        }
      });

      return Math.min(100, modifier); // 최대 100%로 제한
    },
    [rewardState.activeArtifacts],
  );

  // 아이템 강화 확인
  const getItemEnhancement = useCallback(
    (itemType: string) => {
      let enhanced = false;
      let modifier = 1;

      rewardState.activeArtifacts.forEach((artifact) => {
        if (!artifact.isActive) return;

        if (artifact.effect.type === 'item_enhancement') {
          if (artifact.effect.condition === 'enhance_all_items') {
            // 만능 도구: 모든 아이템 25% 강화
            enhanced = true;
            modifier += artifact.effect.value / 100;
          } else if (artifact.effect.condition === 'bomb_3x3' && itemType === 'bomb') {
            // 폭탄 강화기: 폭탄을 3x3 범위로 변경
            enhanced = true;
            modifier = 2; // 특수 효과 표시용
          }
        }
      });

      return { enhanced, modifier };
    },
    [rewardState.activeArtifacts],
  );

  return {
    rewardState,
    showRewardModal,
    availableRewards,
    selectedReward,
    timeRemaining,
    selectReward,
    checkScoreReward,
    applyArtifactEffects,
    getShuffleCost,
    resetRewardState,
    // 새로운 유물 효과 함수들
    getMovementModifier,
    shouldTriggerTurnBasedEffect,
    getProbabilityModifier,
    getItemEnhancement,
  };
};
