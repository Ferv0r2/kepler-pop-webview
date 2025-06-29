'use client';

import { cloneDeep } from 'lodash';
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
  ) => {
    grid: GridItem[][];
    combo: number;
    score: number;
  };
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
        const artifact = artifactId ? cloneDeep(ARTIFACTS[artifactId as ArtifactId]) : undefined;
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
    (grid: GridItem[][], combo: number, baseScore: number) => {
      const modifiedGrid = cloneDeep(grid);
      const modifiedCombo = combo;
      let modifiedScore = baseScore;

      rewardState.activeArtifacts.forEach((artifact) => {
        if (!artifact.isActive) return;

        switch (artifact.effect.type) {
          case 'combo_boost':
            // 콤보 보너스는 이미 calculateComboBonus에서 처리됨
            break;

          case 'score_boost':
            modifiedScore = Math.floor(modifiedScore * (1 + artifact.effect.value));
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
  };
};
