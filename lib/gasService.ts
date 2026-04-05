// Google Apps Script 백엔드 서비스
// Code.gs를 Google Apps Script에 배포한 후, 아래 URL을 웹앱 URL로 교체하세요.

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

interface GasResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function postToGas<T = unknown>(payload: Record<string, unknown>): Promise<GasResponse<T>> {
  if (!GAS_URL) {
    console.warn('GAS_URL이 설정되지 않았습니다. VITE_GAS_URL 환경변수를 설정하세요.');
    return { success: false, error: 'GAS_URL not configured' };
  }
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    console.error('GAS POST 실패:', error);
    return { success: false, error: String(error) };
  }
}

async function getFromGas<T = unknown>(params: Record<string, string>): Promise<GasResponse<T>> {
  if (!GAS_URL) {
    console.warn('GAS_URL이 설정되지 않았습니다. VITE_GAS_URL 환경변수를 설정하세요.');
    return { success: false, error: 'GAS_URL not configured' };
  }
  try {
    const url = new URL(GAS_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const response = await fetch(url.toString());
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    console.error('GAS GET 실패:', error);
    return { success: false, error: String(error) };
  }
}

export const gasService = {
  // 세션 생성
  createSession: (sessionJson: string, gameStateJson?: string) =>
    postToGas({ action: 'createSession', sessionJson, gameStateJson }),

  // 세션 업데이트
  updateSession: (sessionId: string, sessionJson: string) =>
    postToGas({ action: 'updateSession', sessionId, sessionJson }),

  // 세션 삭제
  deleteSession: (sessionId: string) =>
    postToGas({ action: 'deleteSession', sessionId }),

  // 모든 세션 가져오기
  getAllSessions: () =>
    getFromGas<unknown[]>({ action: 'getAllSessions' }),

  // 특정 세션 가져오기
  getSession: (sessionId: string) =>
    getFromGas({ action: 'getSession', sessionId }),

  // 접근코드로 세션 찾기
  getSessionByAccessCode: (accessCode: string) =>
    getFromGas({ action: 'getSessionByAccessCode', accessCode }),

  // 게임 상태 업데이트 (merge 지원)
  updateGameState: (sessionId: string, stateJson: string, merge: boolean = true) =>
    postToGas({ action: 'updateGameState', sessionId, stateJson, merge }),

  // 게임 상태 가져오기
  getGameState: (sessionId: string) =>
    getFromGas({ action: 'getGameState', sessionId }),

  // 턴 기록 추가 (Google Sheets 열람용)
  appendTurnLog: (logData: Record<string, unknown>) =>
    postToGas({ action: 'appendTurnLog', ...logData }),

  // 서버 상태 확인
  ping: () =>
    getFromGas({ action: 'ping' }),
};
