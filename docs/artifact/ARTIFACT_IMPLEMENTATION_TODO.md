# 🏺 유물 시스템 확장 구현 체크리스트

## ✅ Phase 1: 기반 구조 (완료)

### 타입 시스템 확장

- [x] **ArtifactId 타입 확장**: 30개 새로운 유물 ID 추가
- [x] **ArtifactEffect 타입 확장**: 9개 새로운 효과 타입 추가
  - [x] `turn_based`: 턴 기반 효과
  - [x] `one_time`: 일회용 효과
  - [x] `probability_modifier`: 확률 수정자
  - [x] `item_enhancement`: 아이템 강화
  - [x] `movement_modifier`: 이동 관련 효과
  - [x] `gravity_effect`: 중력 효과
  - [x] `vision_effect`: 시각 효과
  - [x] `passive_bonus`: 패시브 보너스
  - [x] `tile_conversion`: 타일 변환

### 유물 데이터 정의

- [x] **artifacts.ts 확장**: 30개 새 유물 정의
  - [x] 점수 & 콤보 계열 (5개)
  - [x] 타일 변환 계열 (5개)
  - [x] 방어 & 회복 계열 (5개)
  - [x] 확률 & 랜덤 계열 (5개)
  - [x] 아이템 강화 계열 (5개)
  - [x] 특수 메커니즘 계열 (5개)

### 기본 효과 처리 로직

- [x] **useRewardSystem.ts 확장**
  - [x] `applyArtifactEffects` 함수 확장
  - [x] `getMovementModifier` 함수 추가
  - [x] `shouldTriggerTurnBasedEffect` 함수 추가
  - [x] `getProbabilityModifier` 함수 추가
  - [x] `getItemEnhancement` 함수 추가

---

## 🚧 Phase 2: 게임 로직 통합 (진행 중)

### GameView.tsx 메인 로직 통합

- [ ] **턴 기반 효과 처리**
  - [ ] `time_warp` (시간 왜곡기): 10턴마다 3턴 동안 점수 2배
  - [ ] `crystal_converter` (크리스탈 변환기): 7턴마다 랜덤 타일 3개를 최고 등급으로
  - [ ] `chaos_engine` (카오스 엔진): 3턴마다 랜덤 타일 2개 위치 교체
  - [ ] `mystery_box` (미스터리 박스): 5턴마다 랜덤 아이템 획득
  - [ ] `quantum_entanglement` (퀀텀 얽힘): 5턴마다 동일 타입 전체 제거 가능

- [ ] **일회용 효과 처리**
  - [ ] `time_rewind` (시간 되돌리기): 게임 오버 시 10턴 추가
  - [ ] `uniformity_device` (균일화 장치): 게임 시작 시 타일 통일
  - [ ] `item_station` (아이템 충전소): 게임 시작 시 아이템 +3
  - [ ] `safety_net` (안전망): 이동 횟수 0 시 3턴 추가

- [ ] **이동 횟수 수정자 적용**
  - [ ] `emergency_charger` (긴급 충전기): 이동 5 이하 시 +2
  - [ ] `shield_generator` (보호막 생성기): 10번째마다 무료 이동
  - [ ] `teleporter` (텔레포터): 턴당 1회 무료 교환

### 매치 시스템 확장

- [ ] **useMatchGame.ts 확률 기반 효과**
  - [ ] `color_bomb` (색채 폭탄): 20% 확률로 인접 타일 변환
  - [ ] `evolution_catalyst` (진화 촉진제): 2등급 → 3등급 50% 승급
  - [ ] `tile_duplicator` (타일 복제기): 3등급 생성 시 30% 복제
  - [ ] `gamblers_coin` (도박사의 동전): 50% 확률로 점수 0 또는 3배
  - [ ] `mutagen` (변이 유발기): 10% 확률로 랜덤 타일 변환

- [ ] **특수 매치 로직**
  - [ ] 퀀텀 얽힘: 같은 타입 전체 제거
  - [ ] 우주 공명기: 5개+ 매치 시 점수 3배
  - [ ] 황금 수확기: 4콤보 달성 시 500점 보너스

### 아이템 시스템 강화

- [ ] **useGameItem.ts 아이템 강화**
  - [ ] `bomb_enhancer` (폭탄 강화기): 5x5 범위로 확장
  - [ ] `continuous_use` (연속 사용권): 30% 확률로 소모 안됨
  - [ ] `universal_tool` (만능 도구): 모든 아이템 25% 강화
  - [ ] `item_converter` (아이템 변환기): 10턴마다 교체 가능

---

## 📋 Phase 3: 시각적 개선

### Canvas 렌더링 효과

- [ ] **특수 시각 효과**
  - [ ] `gravity_inverter`: 타일이 아래에서 위로 올라오는 효과
  - [ ] `freeze_preserver`: 선택된 타일 얼음 효과
  - [ ] `vision_expander`: 다음 타일 미리보기
  - [ ] 시간 왜곡기 활성화 시 화면 효과

- [ ] **상태 표시**
  - [ ] 턴 기반 효과 카운트다운
  - [ ] 일회용 효과 사용 가능 표시
  - [ ] 확률 효과 발동 시 시각적 피드백

### UI/UX 개선

- [ ] **ArtifactPanel.tsx 확장**
  - [ ] 희귀도 시스템 표시 (일반/희귀/영웅/전설)
  - [ ] 유물 상태 표시 (활성/비활성/쿨다운)
  - [ ] 유물 세트 효과 표시

- [ ] **새로운 모달/알림**
  - [ ] 턴 기반 효과 발동 알림
  - [ ] 특수 상황 안내 (시간 되돌리기 등)
  - [ ] 확률 효과 성공/실패 피드백

---

## 📋 Phase 4: 테스트 및 최적화

### 기능 테스트

- [ ] **개별 유물 효과 검증**
  - [ ] 점수 계산 정확성
  - [ ] 턴 기반 트리거 정확성
  - [ ] 확률 효과 발동률 검증
  - [ ] 일회용 효과 소모 확인

- [ ] **복합 효과 테스트**
  - [ ] 행운의 주사위 + 다른 확률 효과
  - [ ] 점수 부스트 유물들의 중첩
  - [ ] 이동 수정자들의 조합

- [ ] **예외 상황 처리**
  - [ ] 게임 재시작 시 상태 초기화
  - [ ] 동시 발동 효과 우선순위
  - [ ] 음수 값 방지 (이동 횟수 등)

### 밸런스 조정

- [ ] **수치 조정**
  - [ ] 확률 값 검토 및 조정
  - [ ] 점수 배율 최적화
  - [ ] 턴 간격 밸런싱

- [ ] **게임플레이 밸런스**
  - [ ] 게임 난이도 곡선 유지
  - [ ] 너무 강력한 조합 제한
  - [ ] 플레이 시간 적정성 검토

### 성능 최적화

- [ ] **효과 처리 최적화**
  - [ ] 불필요한 계산 제거
  - [ ] 효과 캐싱 시스템
  - [ ] 메모리 사용량 최적화

---

## 🎯 세부 구현 가이드

### 턴 기반 효과 구현 패턴

```typescript
// GameView.tsx에서 턴 종료 시 체크
useEffect(() => {
  if (gameState.turn > 0) {
    // 각 턴 기반 유물 체크
    if (shouldTriggerTurnBasedEffect('time_warp', gameState.turn)) {
      // 시간 왜곡기 효과 활성화
    }
    if (shouldTriggerTurnBasedEffect('crystal_converter', gameState.turn)) {
      // 크리스탈 변환기 효과 실행
    }
  }
}, [gameState.turn]);
```

### 확률 기반 효과 구현 패턴

```typescript
// 매치 처리 시 확률 효과 적용
const processMatch = (matches) => {
  matches.forEach((match) => {
    const baseChance = getBaseProbability(match.type);
    const modifiedChance = getProbabilityModifier(baseChance, 'tier_upgrade');

    if (Math.random() < modifiedChance / 100) {
      // 효과 발동
    }
  });
};
```

### 일회용 효과 관리 패턴

```typescript
// 유물 효과에 사용 횟수 추가
const useOneTimeEffect = (artifactId: string) => {
  setRewardState((prev) => ({
    ...prev,
    activeArtifacts: prev.activeArtifacts.map((artifact) =>
      artifact.id === artifactId && artifact.effect.usesRemaining
        ? { ...artifact, effect: { ...artifact.effect, usesRemaining: artifact.effect.usesRemaining - 1 } }
        : artifact,
    ),
  }));
};
```

---

## 🔍 테스트 시나리오

### 기본 시나리오

1. **새로운 유물 획득**: 보상 모달에서 새 유물 선택 가능한지 확인
2. **효과 발동**: 각 유물의 조건 만족 시 정상 발동되는지 확인
3. **상태 표시**: UI에서 유물 상태가 정확히 표시되는지 확인

### 고급 시나리오

1. **복합 효과**: 여러 유물이 동시에 영향을 주는 상황
2. **경계 케이스**: 이동 횟수 0, 최대 점수 등 극한 상황
3. **성능 테스트**: 많은 유물 보유 시 성능 저하 없는지 확인

---

## 📈 성공 지표 및 KPI

### 기능적 지표

- [ ] 모든 새 유물 효과 정상 동작
- [ ] 기존 게임 기능 영향 없음
- [ ] 타입 에러 0개 유지

### 사용자 경험 지표

- [ ] 게임 플레이 다양성 증가
- [ ] 평균 플레이 시간 연장
- [ ] 유물 조합 실험 증가

### 성능 지표

- [ ] 프레임 드랍 없음 (144 FPS 유지)
- [ ] 메모리 사용량 20% 이하 증가
- [ ] 로딩 시간 영향 없음

---

_이 체크리스트는 유물 시스템 확장의 모든 구현 단계를 세부적으로 추적하기 위한 문서입니다. 각 항목 완료 시 [x] 표시로 진행 상황을 업데이트하세요._
