import imageCompression from 'browser-image-compression';
import { storage } from './firebase'; // 맞춤형 경로 적용
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * 핏걸즈 전용 이미지 최적화 및 업로드 함수
 * @param {File} file - 사용자가 선택한 원본 파일
 * @param {string} folder - 파이어베이스 내 저장 폴더명 (예: 'gallery', 'profiles')
 */
export const uploadOptimizedImage = async (file, folder = 'gallery', customOptions = {}) => {
  // 1. 최적화 옵션 (모든 사진에 공통 적용, customOptions로 오버라이드 가능)
  const options = {
    maxSizeMB: 0.8,           // 1. 용량을 800KB 내외로 더 타이트하게 관리
    maxWidthOrHeight: 1920,  // 2. 🌟 긴 축을 1920px로 고정 (대표님 픽!)
    useWebWorker: true,
    fileType: 'image/webp',   // 3. 무조건 WebP 변환 (압축 효율 극대화)
    initialQuality: 0.8,     // 4. 화질은 80% 수준 유지 (육안상 고화질 유지)
    ...customOptions
  };

  try {
    console.log(`[시작] 원본: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // 2. 중간 변환 작업
    const compressedFile = await imageCompression(file, options);
    
    // 3. 파일명 설정 (.webp로 강제 고정)
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // 4. 파이어베이스 업로드
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // 5. 최종 이미지 URL 및 경로 반환 (Admin 용)
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`[완료] 최적화 후: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return { url: downloadURL, path: snapshot.ref.fullPath };

  } catch (error) {
    console.error("이미지 최적화 업로드 실패:", error);
    throw error;
  }
};
