import imageCompression from 'browser-image-compression';
import { storage } from './firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const UPLOAD_VERSION = 'v7_JPEG_Fixed'; // 캐시 확인용 버전 태그

/**
 * 캔버스 기반 수동 리사이징 (JPEG 고성능 압축)
 */
async function emergencyResize(file, maxWidthOrHeight) {
  console.log(`[FITGIRLS-UPLOAD] ${UPLOAD_VERSION} JPEG 수동 리사이징...`);
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidthOrHeight) {
          height *= maxWidthOrHeight / width;
          width = maxWidthOrHeight;
        }
      } else {
        if (height > maxWidthOrHeight) {
          width *= maxWidthOrHeight / height;
          height = maxWidthOrHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG 85%로 강제 변환 (가장 범용적이고 용량이 안정적임)
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`[FITGIRLS-UPLOAD] JPEG 변환 완료: ${width}x${height}, ${(blob.size/1024/1024).toFixed(2)}MB`);
          // 중복 확장자 방지를 위해 기존 확장자 제거 후 .jpg 붙임
          const baseName = file.name.split('.').slice(0, -1).join('.') || 'upload';
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
        } else {
          reject(new Error("Canvas blob 생성 실패"));
        }
      }, 'image/jpeg', 0.85); 
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지 로드 실패"));
    };
    img.src = objectUrl;
  });
}

/**
 * 핏걸즈 전용 이미지 최적화 및 업로드 함수
 */
export const uploadOptimizedImage = async (file, folder = 'gallery', customOptions = {}) => {
  const options = {
    maxSizeMB: 1.2,           // 대표님 지시: 최적 용량 타겟
    maxWidthOrHeight: 1980,  // 대표님 지시: 1980px 고해상도
    useWebWorker: true,
    fileType: 'image/jpeg',   // WebP 호환성 이슈로 인해 가장 안전한 JPEG로 변경
    initialQuality: 0.85,    // 대표님 지시: 품질 85% 고정
    preserveExif: false,     // 메타데이터 삭제
    ...customOptions
  };

  try {
    console.log(`[FITGIRLS-UPLOAD] ${UPLOAD_VERSION} 시작: ${file.name}`);

    let compressedFile;
    try {
      compressedFile = await imageCompression(file, options);
      
      // 압축 후에도 3MB를 넘거나 리사이징이 안 된 경우 수동 처리
      if (compressedFile.size > 3 * 1024 * 1024 || (file.size > 8 * 1024 * 1024 && compressedFile.size === file.size)) {
        compressedFile = await emergencyResize(file, options.maxWidthOrHeight);
      }
    } catch (err) {
      compressedFile = await emergencyResize(file, options.maxWidthOrHeight);
    }
    
    if (compressedFile.size > 10 * 1024 * 1024) {
      throw new Error(`파일이 너무 큽니다(${(compressedFile.size/1024/1024).toFixed(1)}MB).`);
    }

    // 최종 파일명 및 타입 강제 (WebP 이슈 해결)
    const finalType = 'image/jpeg';
    const finalExt = 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${finalExt}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const metadata = { contentType: finalType };
    const snapshot = await uploadBytes(storageRef, compressedFile, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`[FITGIRLS-UPLOAD] 업로드 성공: ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
    return { url: downloadURL, path: snapshot.ref.fullPath };

  } catch (error) {
    throw new Error(error.message || String(error));
  }
};
