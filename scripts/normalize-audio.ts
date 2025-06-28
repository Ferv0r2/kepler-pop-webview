import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 설정
const INPUT_DIR = path.join(__dirname, '../public/sounds/effect');
const OUTPUT_DIR = path.join(__dirname, '../public/sounds/effect/normalized');
const TARGET_VOLUME_DB = -20; // 목표 볼륨 레벨 (dB)

// 지원하는 오디오 확장자
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'];

/**
 * 디렉토리가 존재하는지 확인하고 없으면 생성
 */
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 디렉토리 생성: ${dirPath}`);
  }
}

/**
 * FFmpeg가 설치되어 있는지 확인
 */
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 오디오 파일의 볼륨을 분석하여 정규화 계수를 계산
 */
function analyzeAudioVolume(inputFile: string) {
  try {
    // FFmpeg를 사용하여 오디오 분석
    const command = `ffmpeg -i "${inputFile}" -af "volumedetect" -f null /dev/null 2>&1`;
    const output = execSync(command, { encoding: 'utf8' });

    // mean_volume과 max_volume 추출
    const meanMatch = output.match(/mean_volume: ([-\d.]+) dB/);
    const maxMatch = output.match(/max_volume: ([-\d.]+) dB/);

    if (meanMatch && maxMatch) {
      const meanVolume = parseFloat(meanMatch[1]);
      const maxVolume = parseFloat(maxMatch[1]);

      console.log(`📊 ${path.basename(inputFile)} - 평균: ${meanVolume}dB, 최대: ${maxVolume}dB`);

      return {
        meanVolume,
        maxVolume,
        targetVolume: TARGET_VOLUME_DB,
        gainDB: TARGET_VOLUME_DB - meanVolume,
      };
    }

    return null;
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      console.error(`❌ 오디오 분석 실패: ${inputFile}`, error.message);
      return null;
    }
  }
}

/**
 * 오디오 파일을 정규화하여 저장
 */
function normalizeAudioFile(inputFile: string, outputFile: string, gainDB: number) {
  try {
    // FFmpeg를 사용하여 볼륨 정규화
    const command = `ffmpeg -i "${inputFile}" -af "volume=${gainDB}dB" -y "${outputFile}"`;

    console.log(`🔄 정규화 중: ${path.basename(inputFile)} (${gainDB > 0 ? '+' : ''}${gainDB}dB)`);

    execSync(command, { stdio: 'ignore' });

    console.log(`✅ 정규화 완료: ${path.basename(outputFile)}`);
    return true;
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      console.error(`❌ 정규화 실패: ${inputFile}`, error.message);
      return false;
    }
    return false;
  }
}

/**
 * 메인 함수
 */
function main() {
  console.log('🎵 오디오 파일 볼륨 정규화 시작...\n');

  // FFmpeg 확인
  if (!checkFFmpeg()) {
    console.error('❌ FFmpeg가 설치되어 있지 않습니다.');
    console.log('📥 FFmpeg 설치 방법:');
    console.log('  - Windows: https://ffmpeg.org/download.html');
    console.log('  - macOS: brew install ffmpeg');
    console.log('  - Ubuntu: sudo apt install ffmpeg');
    process.exit(1);
  }

  // 입력 디렉토리 확인
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ 입력 디렉토리가 존재하지 않습니다: ${INPUT_DIR}`);
    process.exit(1);
  }

  // 출력 디렉토리 생성
  ensureDirectoryExists(OUTPUT_DIR);

  // 오디오 파일 목록 가져오기
  const files = fs.readdirSync(INPUT_DIR).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  if (files.length === 0) {
    console.log('⚠️  정규화할 오디오 파일이 없습니다.');
    return;
  }

  console.log(`📁 발견된 오디오 파일: ${files.length}개\n`);

  let successCount = 0;
  let failCount = 0;

  // 각 파일 처리
  files.forEach((file, index) => {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    console.log(`[${index + 1}/${files.length}] 처리 중: ${file}`);

    // 볼륨 분석
    const analysis = analyzeAudioVolume(inputPath);

    if (analysis) {
      // 정규화 실행
      const success = normalizeAudioFile(inputPath, outputPath, analysis.gainDB);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      failCount++;
    }

    console.log(''); // 빈 줄 추가
  });

  // 결과 요약
  console.log('📋 정규화 결과:');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📁 정규화된 파일 위치: ${OUTPUT_DIR}`);

  if (successCount > 0) {
    console.log('\n💡 다음 단계:');
    console.log('1. 정규화된 파일들을 확인하세요');
    console.log('2. 만족스러우면 원본 파일을 정규화된 파일로 교체하세요');
    console.log('3. sound-helper.ts에서 정규화 코드를 제거하세요');
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };
