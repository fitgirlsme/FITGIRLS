import imageCompression from 'browser-image-compression';
import { storage } from './firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const UPLOAD_VERSION = 'v8_WebP_Optimized'; // 캐시 확인용 버전 태그

/**
 * 캔버스 기반 수동 리사이징 (WebP 고성능 압축)
 */
async function emergencyResize(file, maxWidthOrHeight) {
  console.log(`[FITGIRLS-UPLOAD] ${UPLOAD_VERSION} WebP 수동 리사이징...`);
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

      // WebP 80%로 강제 변환 (용량 대비 화질 최상)
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`[FITGIRLS-UPLOAD] WebP 변환 완료: ${width}x${height}, ${(blob.size/1024/1024).toFixed(2)}MB`);
          // 중복 확장자 방지를 위해 기존 확장자 제거 후 .webp 붙임
          const baseName = file.name.split('.').slice(0, -1).join('.') || 'upload';
          resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
        } else {
          reject(new Error("Canvas blob 생성 실패"));
        }
      }, 'image/webp', 0.80); 
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
    maxSizeMB: 0.6,           // 1400px 최적화로 타겟 용량 하향 (초고속 로딩)
    maxWidthOrHeight: 1400,   // 전체 이미지 긴 축 1400px 최적화 적용
    useWebWorker: false,      // iOS Safari 오류 방지를 위해 워커 비활성화
    fileType: 'image/webp',   // 최신 브라우저 모두 지원하는 WebP 포맷 사용
    initialQuality: 0.80,    // WebP는 80%로도 충분한 화질 보장
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

    // 최종 파일명 및 타입 강제 (WebP)
    const finalType = 'image/webp';
    const finalExt = 'webp';
    const baseName = `bodyprofile_fitgirls_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fileName = `${baseName}.${finalExt}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const metadata = { contentType: finalType };
    const snapshot = await uploadBytes(storageRef, compressedFile, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create and upload a 1080px thumbnail for tablet/desktop grid
    let thumbURL = downloadURL;
    let thumbPath = snapshot.ref.fullPath;
    try {
      const thumbOptions = { ...options, maxWidthOrHeight: 1080, initialQuality: 0.75 };
      const thumbFile = await imageCompression(file, thumbOptions);
      const thumbFileName = `${baseName}_1080x1080.${finalExt}`;
      const thumbRef = ref(storage, `${folder}/thumbs/${thumbFileName}`);
      const thumbSnap = await uploadBytes(thumbRef, thumbFile, metadata);
      thumbURL = await getDownloadURL(thumbSnap.ref);
      thumbPath = thumbSnap.ref.fullPath;
      console.log(`[FITGIRLS-UPLOAD] 1080p 썸네일 업로드 성공: ${(thumbFile.size/1024/1024).toFixed(2)}MB`);
    } catch (thumbErr) {
      console.warn('1080p 썸네일 생성 실패, 원본 URL 사용', thumbErr);
    }

    // Create and upload a 480px thumbnail for mobile grid optimization (~30KB)
    let mobileThumbURL = thumbURL;
    let mobileThumbPath = thumbPath;
    try {
      const mobileOptions = { ...options, maxWidthOrHeight: 480, initialQuality: 0.75 };
      const mobileFile = await imageCompression(file, mobileOptions);
      const mobileFileName = `${baseName}_480x480.${finalExt}`;
      const mobileRef = ref(storage, `${folder}/thumbs_mobile/${mobileFileName}`);
      const mobileSnap = await uploadBytes(mobileRef, mobileFile, metadata);
      mobileThumbURL = await getDownloadURL(mobileSnap.ref);
      mobileThumbPath = mobileSnap.ref.fullPath;
      console.log(`[FITGIRLS-UPLOAD] 480p 모바일 썸네일 업로드 성공: ${(mobileFile.size/1024/1024).toFixed(2)}MB`);
    } catch (mobileErr) {
      console.warn('480p 썸네일 생성 실패, 1080p URL 사용', mobileErr);
    }
    
    console.log(`[FITGIRLS-UPLOAD] 원본 업로드 성공: ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
    return { 
      url: downloadURL, 
      path: snapshot.ref.fullPath, 
      thumbUrl: thumbURL, 
      thumbPath,
      mobileThumbUrl: mobileThumbURL,
      mobileThumbPath
    };

  } catch (error) {
    throw new Error(error.message || String(error));
  }
};
