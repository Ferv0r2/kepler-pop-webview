import fs from 'fs';
import path from 'path';

// 설정
const EFFECT_DIR = path.join(__dirname, '../public/sounds/effect');
const NORMALIZED_DIR = path.join(__dirname, '../public/sounds/effect/normalized');

/**
 * 백업 디렉토리 생성
 */
function createBackup() {
  const backupDir = path.join(__dirname, '../public/sounds/effect/backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 백업 디렉토리 생성: ${backupDir}`);
  }
  return backupDir;
}

/**
 * 파일을 백업하고 교체
 */
function replaceFile(originalFile: string, normalizedFile: string, backupDir: string) {
  try {
    const fileName = path.basename(originalFile);
    const backupFile = path.join(backupDir, fileName);

    // 원본 파일을 백업
    fs.copyFileSync(originalFile, backupFile);
    console.log(`💾 백업 완료: ${fileName}`);

    // 정규화된 파일을 원본 위치로 복사
    fs.copyFileSync(normalizedFile, originalFile);
    console.log(`✅ 교체 완료: ${fileName}`);

    return true;
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      console.error(`❌ 파일 교체 실패: ${path.basename(originalFile)}`, error.message);
      return false;
    }
  }
}

/**
 * 메인 함수
 */
function main() {
  console.log('🔄 정규화된 오디오 파일 교체 시작...\n');

  // 정규화된 디렉토리 확인
  if (!fs.existsSync(NORMALIZED_DIR)) {
    console.error(`❌ 정규화된 파일 디렉토리가 존재하지 않습니다: ${NORMALIZED_DIR}`);
    console.log('💡 먼저 npm run normalize-audio를 실행하세요.');
    process.exit(1);
  }

  // 백업 디렉토리 생성
  const backupDir = createBackup();

  // 정규화된 파일 목록 가져오기
  const normalizedFiles = fs.readdirSync(NORMALIZED_DIR).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
  });

  if (normalizedFiles.length === 0) {
    console.log('⚠️  교체할 정규화된 파일이 없습니다.');
    return;
  }

  console.log(`📁 발견된 정규화된 파일: ${normalizedFiles.length}개\n`);

  let successCount = 0;
  let failCount = 0;

  // 각 파일 교체
  normalizedFiles.forEach((file, index) => {
    const originalFile = path.join(EFFECT_DIR, file);
    const normalizedFile = path.join(NORMALIZED_DIR, file);

    console.log(`[${index + 1}/${normalizedFiles.length}] 처리 중: ${file}`);

    // 원본 파일 존재 확인
    if (!fs.existsSync(originalFile)) {
      console.log(`⚠️  원본 파일이 없습니다: ${file}`);
      failCount++;
      return;
    }

    // 파일 교체
    const success = replaceFile(originalFile, normalizedFile, backupDir);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    console.log(''); // 빈 줄 추가
  });

  // 결과 요약
  console.log('📋 교체 결과:');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`💾 백업 위치: ${backupDir}`);

  if (successCount > 0) {
    console.log('\n🎉 교체 완료!');
    console.log('💡 다음 단계:');
    console.log('1. 게임을 실행하여 효과음을 확인하세요');
    console.log('2. 만족스러우면 sound-helper.ts에서 정규화 코드를 제거하세요');
    console.log('3. 필요시 backup 폴더의 원본 파일을 복원할 수 있습니다');
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };
