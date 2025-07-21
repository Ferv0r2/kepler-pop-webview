/**
 * 주간 리더보드 리셋까지 남은 시간을 계산합니다
 */
export const calculateTimeToNextWeek = (): number => {
  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);

  return nextMonday.getTime() - now.getTime();
};

/**
 * 월간 리더보드 리셋까지 남은 시간을 계산합니다
 */
export const calculateTimeToNextMonth = (): number => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return nextMonth.getTime() - now.getTime();
};

/**
 * 일간 리더보드 리셋까지 남은 시간을 계산합니다
 */
export const calculateTimeToNextDay = (): number => {
  const now = new Date();
  const nextDay = new Date();
  nextDay.setDate(now.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);

  return nextDay.getTime() - now.getTime();
};

/**
 * 밀리초를 "X일 Y시간 Z분 W초" 형태로 포맷팅합니다
 */
export const formatTimeRemaining = (ms: number): string => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  } else {
    return `${seconds}초`;
  }
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
};
