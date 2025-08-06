import { useCallback } from 'react';

import type { GTMEvent } from '@/types/gtm.types';

/**
 * GTM (Google Tag Manager) 이벤트 전송을 위한 훅
 *
 * 사용법:
 * const { sendGTMEvent } = useGTM();
 * sendGTMEvent({ event: 'game_start', game_mode: 'casual' });
 */
export const useGTM = () => {
  /**
   * GTM dataLayer에 이벤트를 전송합니다
   * @param eventData GTM 이벤트 데이터
   */
  const sendGTMEvent = useCallback((eventData: GTMEvent) => {
    try {
      // 브라우저 환경에서만 실행
      if (typeof window === 'undefined') {
        return;
      }

      // dataLayer 초기화 (GTM 스크립트가 로드되지 않은 경우를 대비)
      if (!window.dataLayer) {
        window.dataLayer = [];
      }

      // 이벤트 전송 (메타데이터 포함)
      window.dataLayer.push({
        ...eventData,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        page_title: document.title,
      } as GTMEvent);

      // 개발 환경에서 디버깅 로그
      if (process.env.NODE_ENV === 'development') {
        console.log('[GTM] Event sent:', eventData);
      }
    } catch (error) {
      console.error('[GTM] Failed to send event:', error);
    }
  }, []);

  /**
   * 게임 시작 이벤트 전송
   */
  const trackGameStart = useCallback(
    (mode: 'casual' | 'challenge') => {
      sendGTMEvent({
        event: 'game_start',
        event_category: 'game',
        event_action: 'start',
        event_label: mode,
        game_mode: mode,
      });
    },
    [sendGTMEvent],
  );

  /**
   * 게임 종료 이벤트 전송
   */
  const trackGameEnd = useCallback(
    (data: {
      mode: 'casual' | 'challenge';
      score: number;
      moves_used: number;
      duration: number; // 초 단위
    }) => {
      sendGTMEvent({
        event: 'game_end',
        event_category: 'game',
        event_action: 'end',
        event_label: data.mode,
        value: data.score,
        game_mode: data.mode,
        score: data.score,
        moves_used: data.moves_used,
        game_duration: data.duration,
      });
    },
    [sendGTMEvent],
  );

  /**
   * 레벨업 이벤트 전송
   */
  const trackLevelUp = useCallback(
    (newLevel: number) => {
      sendGTMEvent({
        event: 'level_up',
        event_category: 'progression',
        event_action: 'level_up',
        event_label: `level_${newLevel}`,
        value: newLevel,
        level: newLevel,
      });
    },
    [sendGTMEvent],
  );

  /**
   * 구매 이벤트 전송
   */
  const trackPurchase = useCallback(
    (data: {
      item_name: string;
      item_category: string;
      value: number;
      currency: string;
      transaction_id?: string;
      payment_type: 'gem' | 'iap';
    }) => {
      sendGTMEvent({
        event: 'purchase',
        event_category: 'ecommerce',
        event_action: 'purchase',
        event_label: data.item_name,
        value: data.value,
        currency: data.currency,
        item_name: data.item_name,
        item_category: data.item_category,
        transaction_id: data.transaction_id,
        payment_type: data.payment_type,
      });
    },
    [sendGTMEvent],
  );

  /**
   * 사용자 로그인 이벤트 전송
   */
  const trackLogin = useCallback(
    (method: 'google') => {
      sendGTMEvent({
        event: 'login',
        event_category: 'user',
        event_action: 'login',
        event_label: method,
        login_method: method,
      });
    },
    [sendGTMEvent],
  );

  /**
   * 버튼 클릭 이벤트 전송
   */
  const trackButtonClick = useCallback(
    (buttonName: string, section?: string) => {
      sendGTMEvent({
        event: 'button_click',
        event_category: 'interaction',
        event_action: 'click',
        event_label: buttonName,
        button_name: buttonName,
        section: section,
      });
    },
    [sendGTMEvent],
  );

  /**
   * 가챠 오픈 이벤트 전송
   */
  const trackGachaOpen = useCallback(
    (boxType: string) => {
      sendGTMEvent({
        event: 'gacha_open',
        event_category: 'gacha',
        event_action: 'open',
        event_label: boxType,
        box_type: boxType,
      });
    },
    [sendGTMEvent],
  );

  /**
   * 가챠 보상 이벤트 전송
   */
  const trackGachaReward = useCallback(
    (data: { box_type: string; reward_type: 'common' | 'rare' | 'epic' | 'legendary'; tech_points_gained: number }) => {
      sendGTMEvent({
        event: 'gacha_reward',
        event_category: 'gacha',
        event_action: 'reward',
        event_label: data.reward_type,
        value: data.tech_points_gained,
        box_type: data.box_type,
        reward_type: data.reward_type,
        tech_points_gained: data.tech_points_gained,
      });
    },
    [sendGTMEvent],
  );

  return {
    sendGTMEvent,
    trackGameStart,
    trackGameEnd,
    trackLevelUp,
    trackPurchase,
    trackLogin,
    trackButtonClick,
    trackGachaOpen,
    trackGachaReward,
  };
};

export default useGTM;
