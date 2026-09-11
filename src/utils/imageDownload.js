/**
 * WebP 등 모든 이미지 URL을 고화질 JPG로 변환하여 다운로드하는 유틸리티
 * @param {string} imageUrl - 다운로드할 이미지 URL (WebP, PNG 등)
 * @param {string} filename - 저장될 파일명 (기본값: fitgirls_photo.jpg)
 */
export async function downloadImageAsJpg(imageUrl, filename = 'fitgirls_photo.jpg') {
  if (!imageUrl) {
    throw new Error('이미지 URL이 유효하지 않습니다.');
  }

  let finalName = filename;
  if (!finalName.toLowerCase().endsWith('.jpg') && !finalName.toLowerCase().endsWith('.jpeg')) {
    finalName = finalName.replace(/\.[^/.]+$/, '') + '.jpg';
  }

  // 1. fetch로 이미지 Blob을 가져오는 방식 (Firebase Storage CORS 지원 시 가장 안전)
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      cache: 'default'
    });

    if (response.ok) {
      const blob = await response.blob();
      
      let imgSource;
      if (typeof createImageBitmap === 'function') {
        imgSource = await createImageBitmap(blob);
      } else {
        imgSource = await new Promise((resolve, reject) => {
          const img = new Image();
          const objUrl = URL.createObjectURL(blob);
          img.onload = () => {
            URL.revokeObjectURL(objUrl);
            resolve(img);
          };
          img.onerror = (e) => {
            URL.revokeObjectURL(objUrl);
            reject(e);
          };
          img.src = objUrl;
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = imgSource.width;
      canvas.height = imgSource.height;
      const ctx = canvas.getContext('2d');

      // 배경을 흰색(#FFFFFF)으로 채움 (투명 픽셀 방지)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgSource, 0, 0);

      return new Promise((resolve, reject) => {
        canvas.toBlob((jpgBlob) => {
          if (!jpgBlob) {
            reject(new Error('JPG 변환에 실패했습니다.'));
            return;
          }
          triggerDownload(jpgBlob, finalName);
          resolve();
        }, 'image/jpeg', 0.95);
      });
    }
  } catch (fetchErr) {
    console.warn('[imageDownload] fetch 방식 실패, Image 객체로 폴백:', fetchErr);
  }

  // 2. Image 객체 + crossOrigin 폴백 방식
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const separator = imageUrl.includes('?') ? '&' : '?';
    img.src = `${imageUrl}${separator}_dl=${Date.now()}`;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((jpgBlob) => {
          if (!jpgBlob) {
            reject(new Error('JPG Blob 생성 실패'));
            return;
          }
          triggerDownload(jpgBlob, finalName);
          resolve();
        }, 'image/jpeg', 0.95);
      } catch (err) {
        console.error('[imageDownload] 캔버스 변환 실패 (CORS 등):', err);
        window.open(imageUrl, '_blank');
        resolve();
      }
    };

    img.onerror = () => {
      console.error('[imageDownload] 이미지 로드 실패, 직접 열기 시도');
      window.open(imageUrl, '_blank');
      resolve();
    };
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
