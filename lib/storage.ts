// 이미지 업로드 유틸리티 (클라이언트 측 압축 후 Data URL로 저장)

// 최대 파일 크기: 3MB (원본 기준)
const MAX_FILE_SIZE = 3 * 1024 * 1024;

// 허용되는 이미지 타입
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// 압축 후 목표 크기: ~60KB (base64로 ~80K chars, 세션 데이터에 저장 가능)
const TARGET_SIZE = 60 * 1024;
const MAX_DIMENSION = 800;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 이미지를 리사이즈 + 압축하여 Data URL로 변환
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // 리사이즈 (최대 800x800 비율 유지)
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx!.drawImage(img, 0, 0, width, height);

      // JPEG로 압축 (품질 조절하여 목표 크기 달성)
      let quality = 0.7;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      // 목표 크기보다 크면 품질을 낮춤
      while (dataUrl.length > TARGET_SIZE * 1.37 && quality > 0.1) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));

    // File → Image
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

/**
 * 세션 보드 배경 이미지 업로드
 * 클라이언트에서 압축 후 Data URL 반환 (Google Sheets 세션 데이터에 저장됨)
 */
export const uploadBoardImage = async (
  file: File,
  _sessionId: string
): Promise<UploadResult> => {
  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`
    };
  }

  // 파일 타입 검증
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: '지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP만 가능합니다.'
    };
  }

  try {
    const dataUrl = await compressImage(file);
    return { success: true, url: dataUrl };
  } catch (error: any) {
    console.error('Image compress error:', error);
    return {
      success: false,
      error: `이미지 처리 실패: ${error.message || '알 수 없는 오류'}`
    };
  }
};
