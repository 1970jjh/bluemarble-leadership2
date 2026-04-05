// Google Apps Script 백엔드 서비스
// Vercel 서버리스 함수(/api/gas)를 프록시로 사용하여 CORS 문제 해결

const PROXY_URL = '/api/gas';

interface GasResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function postToGas<T = unknown>(payload: Record<string, unknown>): Promise<GasResponse<T>> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  try {
    const url = new URL(PROXY_URL, window.location.origin);
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
