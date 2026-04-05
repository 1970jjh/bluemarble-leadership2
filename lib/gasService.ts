// Google Apps Script 백엔드 서비스
// kim-is-back과 동일한 패턴: GAS 직접 호출 (text/plain으로 CORS preflight 회피)

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyfLlGnd3Orhhyac4vWBVhDqLtT2qjWh_Cs8_EOjvQEdwuqtEHbNQorBsyVbXgOQMo7/exec';

interface GasResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function postToGas<T = unknown>(payload: Record<string, unknown>): Promise<GasResponse<T>> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error('GAS POST 응답이 JSON이 아님:', text.substring(0, 200));
      return { success: false, error: 'Invalid JSON response' };
    }
  } catch (error) {
    console.error('GAS POST 실패:', error);
    return { success: false, error: String(error) };
  }
}

async function getFromGas<T = unknown>(params: Record<string, string>): Promise<GasResponse<T>> {
  try {
    const url = new URL(GAS_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const response = await fetch(url.toString());
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error('GAS GET 응답이 JSON이 아님:', text.substring(0, 200));
      return { success: false, error: 'Invalid JSON response' };
    }
  } catch (error) {
    console.error('GAS GET 실패:', error);
    return { success: false, error: String(error) };
  }
}

export const gasService = {
  createSession: (sessionJson: string, gameStateJson?: string) =>
    postToGas({ action: 'createSession', sessionJson, gameStateJson }),

  updateSession: (sessionId: string, sessionJson: string) =>
    postToGas({ action: 'updateSession', sessionId, sessionJson }),

  deleteSession: (sessionId: string) =>
    postToGas({ action: 'deleteSession', sessionId }),

  getAllSessions: () =>
    getFromGas<unknown[]>({ action: 'getAllSessions' }),

  getSession: (sessionId: string) =>
    getFromGas({ action: 'getSession', sessionId }),

  getSessionByAccessCode: (accessCode: string) =>
    getFromGas({ action: 'getSessionByAccessCode', accessCode }),

  updateGameState: (sessionId: string, stateJson: string, merge: boolean = true) =>
    postToGas({ action: 'updateGameState', sessionId, stateJson, merge }),

  getGameState: (sessionId: string) =>
    getFromGas({ action: 'getGameState', sessionId }),

  appendTurnLog: (logData: Record<string, unknown>) =>
    postToGas({ action: 'appendTurnLog', ...logData }),

  ping: () =>
    getFromGas({ action: 'ping' }),
};
