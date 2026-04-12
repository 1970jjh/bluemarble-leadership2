// 이미지 업로드 유틸리티 (Google Drive 저장)

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
 * Google Drive에 이미지를 업로드하고 공개 URL을 반환
 */
export const uploadBoardImage = async (
  file: File,
  sessionId: string
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
    // 파일을 base64로 변환
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/png;base64,xxxx 에서 base64 부분만 추출
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });

    // 서버 API를 통해 Google Drive에 업로드
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `board_${sessionId}_${Date.now()}.${extension}`;

    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'uploadImage',
        payload: {
          fileName,
          mimeType: file.type,
          base64Data
        }
      })
    });

    const json = await res.json();

    if (!json.ok) {
      return {
        success: false,
        error: json.error || '이미지 업로드에 실패했습니다.'
      };
    }

    return {
      success: true,
      url: json.data.url
    };
  } catch (error: any) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: `업로드 실패: ${error.message || '알 수 없는 오류'}`
    };
  }
};
