# Kepler Pop 🌌

Kepler Pop is a space-themed puzzle game where players evolve plants, harness the power of cosmic weather, and climb the ranks in an infinite mode challenge.

Built using React Native and TypeScript, Kepler Pop is designed for Android devices.

## 📸 Preview

<img src="./public/preview/preview.gif" alt="Kepler Pop Preview" width="300" />

## 🚀 Features

- **Dynamic Puzzle Gameplay**: Match plant cells to evolve them into higher stages.
- **Cosmic Weather Effects**: Weather changes every N turns, affecting your strategy.
- **Infinite Mode**: Test your endurance and aim for the highest score.
- **Customizable Avatars**: Decorate your plants with unique backgrounds and pots.
- **Daily Rewards**: Water your plant to claim bonuses.
- **Leaderboards**: Compete with others and showcase your skills.

## 🛠️ Tech Stack

- **Frontend**: React Native & Webview with TypeScript
- **State Management**: Context API
- **Backend**: Firebase (planned for leaderboard and user data)
- **Design**: Minimalistic UI with vibrant cosmic themes

## 🤝 Contributions

Contributions are welcome! Please fork this repository and submit a pull request for any enhancements or bug fixes.

## 🌟 Acknowledgments

Inspired by the vast unknown of space and the beauty of nature.
Special thanks to the open-source community for providing great tools and libraries.

---

Enjoy Kepler Pop and let your plants thrive among the stars! 🌌

## 버튼 효과음 시스템

게임의 모든 버튼 상호작용에 효과음을 추가할 수 있는 시스템이 포함되어 있습니다.

### 사용법

1. **ButtonWithSound 컴포넌트 사용** (권장)

   ```tsx
   import { ButtonWithSound } from '@/components/ui/button-with-sound';

   <ButtonWithSound onClick={handleClick}>클릭하세요</ButtonWithSound>;
   ```

2. **useButtonSound 훅 사용**

   ```tsx
   import { useButtonSound } from '@/hooks/useButtonSound';

   const { playButtonClick } = useButtonSound();

   const handleClick = () => {
     playButtonClick();
     // 로직 실행
   };
   ```

3. **HOC 사용**

   ```tsx
   import { withButtonSound } from '@/components/ui/with-button-sound';

   const MyButtonWithSound = withButtonSound(MyButton);
   ```

### 자세한 사용법

[버튼 효과음 사용법 문서](./docs/button-sound-usage.md)를 참조하세요.

## 오디오 파일 볼륨 정규화

게임의 효과음 파일들의 볼륨을 일정하게 맞추기 위한 스크립트가 포함되어 있습니다.

### 사용법

1. **FFmpeg 설치** (필수)

   ```bash
   # Windows: https://ffmpeg.org/download.html
   # macOS: brew install ffmpeg
   # Ubuntu: sudo apt install ffmpeg
   ```

2. **오디오 파일 정규화**

   ```bash
   npm run normalize-audio
   ```

   - `public/sounds/effect/` 폴더의 모든 오디오 파일을 분석
   - `public/sounds/effect/normalized/` 폴더에 정규화된 파일 생성
   - 목표 볼륨: -20dB

3. **정규화된 파일 확인**

   - `public/sounds/effect/normalized/` 폴더에서 정규화된 파일들을 확인
   - 원하는 결과가 나오면 다음 단계로 진행

4. **원본 파일 교체** (선택사항)

   ```bash
   npm run replace-normalized-audio
   ```

   - 정규화된 파일을 원본 파일로 교체
   - 원본 파일은 `public/sounds/effect/backup/` 폴더에 백업

5. **코드 정리** (선택사항)
   - `utils/sound-helper.ts`에서 실시간 정규화 코드 제거
   - 더 빠른 로딩과 재생 성능

### 파일 구조

```
public/sounds/effect/
├── button.mp3          # 원본 파일
├── match.mp3           # 원본 파일
├── game-over.wav       # 원본 파일
├── reward.wav          # 원본 파일
├── artifact.wav        # 원본 파일
├── normalized/         # 정규화된 파일들
│   ├── button.mp3
│   ├── match.mp3
│   ├── game-over.wav
│   ├── reward.wav
│   └── artifact.wav
└── backup/             # 백업 파일들 (교체 후 생성)
    ├── button.mp3
    ├── match.mp3
    ├── game-over.wav
    ├── reward.wav
    └── artifact.wav
```

### 지원 형식

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)

### 주의사항

- FFmpeg가 설치되어 있어야 합니다
- 원본 파일은 자동으로 백업됩니다
- 정규화 실패 시 원본 파일이 그대로 유지됩니다
