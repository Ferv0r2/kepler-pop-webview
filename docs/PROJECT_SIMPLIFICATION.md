# 프로젝트 단순화 문서

## 개요

이 문서는 Kepler Pop WebView 프로젝트의 단순화 작업에 대한 상세한 내용을 다룹니다. 복잡해진 프로젝트를 게임 중심의 간단한 구조로 재구성하였습니다.

## 주요 변경사항

### 1. 🎮 게임 화면을 메인 페이지로 설정

**이전:**

- 메인 페이지 → 로그인 → 게임 선택 → 게임 화면
- 복잡한 사용자 인증 과정 필요

**현재:**

- 메인 페이지 = 게임 화면
- 바로 게임 시작 가능

**변경된 파일:**

- `/app/page.tsx` - `GameViewSimple` 컴포넌트를 직접 렌더링
- `/screens/GameView/GameViewSimple.tsx` - 단순화된 게임 화면 컴포넌트

### 2. 🔐 인증 시스템 제거

**제거된 기능:**

- Google OAuth 로그인
- 게스트 로그인 시스템
- JWT 토큰 관리
- 사용자 프로필 관리

**제거된 파일:**

- `/app/[locale]/auth/` - 전체 인증 페이지
- `/screens/MainView.tsx` - 메인 화면 (인증 후 표시되던)
- `/store/authStore.ts` - Zustand 인증 상태 관리

**변경된 파일:**

- `/middleware.ts` - 인증 로직 제거, locale 관리만 유지

### 3. 🛍️ 스토어 기능 제거

**제거된 기능:**

- 인앱 구매 시스템
- 보석(Gem) 시스템
- 에너지(Droplet) 시스템
- 상점 UI

**제거된 파일:**

- `/app/[locale]/store/` - 전체 스토어 페이지
- `/screens/StoreView/` - 스토어 화면 컴포넌트

**게임 시스템 변경:**

- 무제한 게임 플레이 가능
- 로컬 스토리지로 최고 점수 저장

### 4. ⚙️ 설정을 팝업 모달로 변경

**이전:**

- 별도의 설정 페이지 (`/settings`)
- 네비게이션을 통한 접근

**현재:**

- 게임 화면 내 설정 버튼
- 모달 팝업으로 설정 화면 표시

**포함된 설정:**

- 사운드 효과 on/off
- 타일 스왑 모드 (선택/드래그)
- 튜토리얼 다시 보기
- 게임 재시작

### 5. 🌐 Locale 관리 개선

**이전:**

- URL 경로 기반 locale 관리 (`/ko/game`, `/en/settings`)
- Next.js i18n 라우팅 사용

**현재:**

- URL에서 locale 제거 (모든 경로는 `/`)
- 쿠키 기반 locale 저장
- 브라우저 언어 설정 자동 감지
- middleware에서 locale 처리

**새로운 구조:**

- `middleware.ts` - locale 감지 및 쿠키 설정
- `LocaleProvider.tsx` - React 컨텍스트로 locale 제공
- `useLocale.ts` - locale 관리 훅

## 기술적 개선사항

### Middleware 최적화

- 복잡한 인증 로직 제거
- locale 처리만 유지
- 성능 향상

### innerHTML 최소화

**이전:**

```javascript
dangerouslySetInnerHTML={{
  __html: `복잡한 스크립트 코드...`
}}
```

**현재:**

- 서버 사이드에서 locale 감지
- React 컴포넌트로 locale 제공
- 클라이언트 사이드 스크립트 최소화

### 컴포넌트 단순화

- `GameViewSimple.tsx` - 기존 `GameView.tsx`에서 불필요한 기능 제거
- 인증 관련 로직 제거
- 에너지/보석 시스템 제거
- 로컬 스토리지 기반 점수 관리

## 파일 구조 변화

### 제거된 디렉토리/파일

```
app/[locale]/auth/          # 인증 페이지
app/[locale]/store/         # 스토어 페이지
screens/MainView.tsx        # 메인 화면
screens/StoreView/          # 스토어 화면
store/authStore.ts          # 인증 상태 관리
```

### 새로 추가된 파일

```
screens/GameView/GameViewSimple.tsx     # 단순화된 게임 화면
components/providers/LocaleProvider.tsx # Locale 제공자
hooks/useLocale.ts                      # Locale 관리 훅
hooks/useLocaleFromHeaders.ts           # 헤더 기반 locale 감지
docs/PROJECT_SIMPLIFICATION.md         # 이 문서
```

### 주요 변경된 파일

```
app/page.tsx                # GameViewSimple 직접 렌더링
app/layout.tsx             # LocaleProvider 추가, 스크립트 최소화
middleware.ts              # 인증 로직 제거, locale만 처리
messages/en.json           # 새로운 설정 관련 번역 추가
messages/ko.json           # 새로운 설정 관련 번역 추가
```

## 설정 시스템 상세

### SettingsModal 컴포넌트

새롭게 추가된 설정 모달은 다음 기능을 제공합니다:

1. **사운드 설정**

   - 효과음 on/off 토글

2. **게임플레이 설정**

   - 타일 스왑 모드 선택 (선택/드래그)

3. **도움말**

   - 튜토리얼 다시 보기

4. **게임 관리**
   - 게임 재시작 (로컬 상태 초기화)

### 번역 키 추가

```json
{
  "settings": {
    "soundVolume": "Sound Effects",
    "tileSwapMode": "Tile Swap Mode",
    "selectMode": "Select Mode",
    "dragMode": "Drag Mode",
    "tutorial": "Tutorial"
  },
  "game": {
    "newHighScore": "New High Score!"
  },
  "common": {
    "on": "On",
    "off": "Off"
  }
}
```

## 성능 개선

### 번들 크기 감소

- 인증 관련 라이브러리 의존성 감소
- 복잡한 상태 관리 로직 제거
- 불필요한 API 호출 제거

### 로딩 시간 단축

- 인증 과정 생략으로 즉시 게임 시작
- 서버 의존성 감소 (로컬 점수 저장)

### 메모리 사용량 최적화

- 복잡한 상태 관리 제거
- 불필요한 컴포넌트 제거

## 사용자 경험 개선

### 접근성 향상

- 복잡한 회원가입/로그인 과정 제거
- 즉시 게임 플레이 가능

### 직관적인 UI

- 게임 화면이 메인 화면
- 설정은 쉽게 접근 가능한 모달
- 불필요한 네비게이션 제거

### 오프라인 친화적

- 서버 의존성 최소화
- 로컬 스토리지 기반 데이터 관리

## 호환성 고려사항

### 기존 사용자 데이터

- 로컬 스토리지의 기존 최고 점수는 유지
- 쿠키 기반 locale 설정은 기존 설정 유지

### WebView 환경

- 기존 네이티브 앱과의 통신 인터페이스 유지
- WebViewBridge 기능은 그대로 유지

## 향후 개선 계획

### 단기 계획

1. 다국어 번역 완성
2. 게임 밸런스 조정
3. 성능 최적화 추가

### 장기 계획

1. PWA 지원 추가
2. 오프라인 모드 개선
3. 접근성 향상

## 결론

이번 단순화 작업을 통해:

- **사용자 경험**: 복잡한 인증 과정 없이 바로 게임 플레이
- **개발 효율성**: 복잡한 인증/결제 시스템 제거로 유지보수 부담 감소
- **성능**: 번들 크기 감소 및 로딩 시간 단축
- **접근성**: 언어 설정 자동 감지 및 쉬운 변경

프로젝트가 게임 자체에 집중할 수 있는 구조로 변경되었습니다.
