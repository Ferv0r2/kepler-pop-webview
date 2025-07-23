/**
 * 주간 리더보드 리셋까지 남은 시간을 계산합니다 (UTC 기준)
 * 백엔드와 일치하도록 월요일 기준으로 계산
 */
export const calculateTimeToNextWeek = (): number => {
  const now = new Date();

  // UTC 기준으로 요일 계산
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // UTC 기준으로 다음 주 월요일 자정 계산
  const nextMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToMonday + 7, 0, 0, 0, 0),
  );

  return nextMonday.getTime() - now.getTime();
};

/**
 * 월간 리더보드 리셋까지 남은 시간을 계산합니다 (UTC 기준)
 * 백엔드와 일치하도록 매월 1일 자정 기준으로 계산
 */
export const calculateTimeToNextMonth = (): number => {
  const now = new Date();

  // UTC 기준으로 다음달 1일 자정 계산
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

  return nextMonth.getTime() - now.getTime();
};

/**
 * 일간 리더보드 리셋까지 남은 시간을 계산합니다 (UTC 기준)
 * 백엔드와 일치하도록 자정 기준으로 계산
 */
export const calculateTimeToNextDay = (): number => {
  const now = new Date();

  // UTC 기준으로 다음날 자정 계산
  const nextDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

  return nextDay.getTime() - now.getTime();
};

/**
 * 밀리초를 현재 로케일에 맞게 포맷팅합니다 (Intl API 사용)
 */
export const formatTimeRemaining = (ms: number, locale = 'ko'): string => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  // 가장 큰 단위 두 개를 표시
  if (days > 0) {
    const dayPart = new Intl.NumberFormat(locale).format(days) + getTimeUnitLabel('day', locale);
    const hourPart = new Intl.NumberFormat(locale).format(hours) + getTimeUnitLabel('hour', locale);
    return `${dayPart} ${hourPart}`;
  } else if (hours > 0) {
    const hourPart = new Intl.NumberFormat(locale).format(hours) + getTimeUnitLabel('hour', locale);
    const minutePart = new Intl.NumberFormat(locale).format(minutes) + getTimeUnitLabel('minute', locale);
    return `${hourPart} ${minutePart}`;
  } else if (minutes > 0) {
    const minutePart = new Intl.NumberFormat(locale).format(minutes) + getTimeUnitLabel('minute', locale);
    return minutePart;
  } else {
    const secondPart = new Intl.NumberFormat(locale).format(seconds) + getTimeUnitLabel('second', locale);
    return secondPart;
  }
};

/**
 * 로케일에 맞는 시간 단위 라벨을 반환합니다
 */
export const getTimeUnitLabel = (unit: 'day' | 'hour' | 'minute' | 'second', locale = 'ko'): string => {
  const units = {
    ko: { day: '일', hour: '시간', minute: '분', second: '초' },
    en: { day: 'd', hour: 'h', minute: 'm', second: 's' },
    ja: { day: '日', hour: '時間', minute: '分', second: '秒' },
    zh: { day: '天', hour: '小时', minute: '分', second: '秒' },
    es: { day: 'd', hour: 'h', minute: 'm', second: 's' },
    pt: { day: 'd', hour: 'h', minute: 'm', second: 's' },
  };

  return units[locale as keyof typeof units]?.[unit] || units.en[unit];
};

/**
 * 밀리초를 "HH:MM:SS" 형태로 포맷팅합니다
 */
export const formatTimeRemainingCompact = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * 리더보드 기간에 따른 다음 리셋 시간을 계산합니다
 */
export const calculateNextResetTime = (period: 'daily' | 'weekly' | 'monthly' | 'all'): number => {
  const timeRemaining = (() => {
    switch (period) {
      case 'daily':
        return calculateTimeToNextDay();
      case 'weekly':
        return calculateTimeToNextWeek();
      case 'monthly':
        return calculateTimeToNextMonth();
      case 'all':
      default:
        return 0; // 전체 기간은 리셋이 없음
    }
  })();

  return timeRemaining;
};
