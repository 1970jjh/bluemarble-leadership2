// 이미지 업로드 유틸리티 (Firebase 제거 - Base64 Data URL 방식)

// 최대 파일 크기: 3MB
const MAX_FILE_SIZE = 3 * 1024 * 1024;

// 허용되는 이미지 타입
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 세션 보드 배경 이미지 업로드
 * Firebase Storage 대신 Base64 Data URL로 변환하여 세션 데이터에 직접 저장
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
    // 파일을 Base64 Data URL로 변환
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });

    return {
      success: true,
      url: dataUrl
    };
  } catch (error: any) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: `업로드 실패: ${error.message || '알 수 없는 오류'}`
    };
  }
};
