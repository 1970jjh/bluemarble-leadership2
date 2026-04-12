// Google Sheets 백엔드 서비스 (Firebase 대체)
// Vercel 서버리스 함수(/api/sheets)를 통해 Google Sheets API와 통신
import type { Session, Team, TurnRecord, GamePhase, SessionStatus } from '../types';

// API 엔드포인트
const API_URL = '/api/sheets';

// 클라이언트 측 재시도 로직 (네트워크 오류, 500 대응)
const CLIENT_MAX_RETRIES = 2;
const CLIENT_BASE_DELAY = 1500;

async function callAPI(action: string, payload: any = {}): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= CLIENT_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });

      // 5xx 서버 오류 → 재시도
      if (res.status >= 500 && attempt < CLIENT_MAX_RETRIES) {
        const delay = CLIENT_BASE_DELAY * Math.pow(2, attempt);
        console.warn(`[Sheets] ${action} server error ${res.status}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || `API error: ${action}`);
      }
      return json.data;
    } catch (err: any) {
      lastError = err;
      // 네트워크 오류 (fetch 자체 실패) → 재시도
      if (err.name === 'TypeError' && attempt < CLIENT_MAX_RETRIES) {
        const delay = CLIENT_BASE_DELAY * Math.pow(2, attempt);
        console.warn(`[Sheets] ${action} network error, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error(`API call failed: ${action}`);
}

// Unsubscribe 타입 (폴링 기반)
type Unsubscribe = () => void;

// ========================
// 세션(Session) 관련 함수
// ========================

export async function createSession(session: Session): Promise<void> {
  console.log('[Sheets] createSession:', session.id, 'accessCode:', session.accessCode);
  await callAPI('createSession', session);
  console.log('[Sheets] createSession 성공:', session.id);
}

export async function getSession(sessionId: string): Promise<Session | null> {
  return await callAPI('getSession', { sessionId });
}

export async function getSessionByAccessCode(accessCode: string): Promise<Session | null> {
  console.log('[Sheets] getSessionByAccessCode:', accessCode);
  const result = await callAPI('getSessionByAccessCode', { accessCode });
  console.log('[Sheets] 결과:', result ? '찾음' : '없음');
  return result;
}

export async function getAllSessions(): Promise<Session[]> {
  return await callAPI('getAllSessions');
}

export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
  await callAPI('updateSession', { sessionId, updates });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await callAPI('deleteSession', { sessionId });
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
  await updateSession(sessionId, { status });
}

// ========================
// 팀(Team) 관련 함수
// ========================

export async function updateTeams(sessionId: string, teams: Team[]): Promise<void> {
  await updateSession(sessionId, { teams, lastUpdated: Date.now() });
}

export async function updateTeam(sessionId: string, teamId: string, updates: Partial<Team>): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  const updatedTeams = session.teams.map(team =>
    team.id === teamId ? { ...team, ...updates } : team
  );

  await updateTeams(sessionId, updatedTeams);
}


// ========================
// 게임 상태(GameState) 관련
// ========================

export interface TeamResponseData {
  teamId: string;
  teamName: string;
  selectedChoice: { id: string; text: string } | null;
  reasoning: string;
  submittedAt: number;
  isSubmitted: boolean;
}

export interface TeamRankingData {
  teamId: string;
  teamName: string;
  rank: number;
  score: number;
  feedback: string;
  selectedChoice: { id: string; text: string } | null;
  reasoning: string;
}

export interface AIComparativeResultData {
  rankings: TeamRankingData[];
  guidance: string;
  analysisTimestamp: number;
}

export interface GameState {
  sessionId: string;
  phase: string;
  currentTeamIndex: number;
  currentTurn: number;
  diceValue: [number, number];
  currentCard: any | null;
  selectedChoice: { id: string; text: string } | null;
  reasoning: string;
  aiResult: {
    feedback: string;
    scoreChanges: {
      capital?: number;
      energy?: number;
      reputation?: number;
      trust?: number;
      competency?: number;
      insight?: number;
    };
  } | null;
  isSubmitted: boolean;
  isAiProcessing: boolean;
  isGameStarted?: boolean;
  spectatorVotes?: { [optionId: string]: string[] };
  gameLogs: string[];
  lastUpdated: number;
  currentSquareIndex?: number;
  teamResponses?: { [teamId: string]: TeamResponseData };
  isRevealed?: boolean;
  aiComparativeResult?: AIComparativeResultData | null;
  isAnalyzing?: boolean;
  territories?: { [squareIndex: string]: {
    ownerTeamId: string;
    ownerTeamName: string;
    ownerTeamColor: string;
    acquiredAt: number;
  } };
}

export async function saveGameState(state: GameState): Promise<void> {
  await callAPI('updateGameState', {
    sessionId: state.sessionId,
    updates: { ...state, lastUpdated: Date.now() }
  });
}

export async function updateGameState(sessionId: string, updates: Partial<GameState>): Promise<void> {
  await callAPI('updateGameState', {
    sessionId,
    updates: { ...updates, lastUpdated: Date.now() }
  });
}

export async function getGameState(sessionId: string): Promise<GameState | null> {
  return await callAPI('getGameState', { sessionId });
}

export async function addGameLog(sessionId: string, log: string): Promise<void> {
  const state = await getGameState(sessionId);
  const currentLogs = state?.gameLogs || [];
  await updateGameState(sessionId, {
    gameLogs: [...currentLogs, `[${new Date().toLocaleTimeString()}] ${log}`]
  });
}


// ========================
// 동시 응답 시스템
// ========================

export async function updateTeamResponse(
  sessionId: string,
  teamId: string,
  response: TeamResponseData
): Promise<void> {
  // 1. GameState에 실시간 응답 저장 (폴링용)
  const state = await getGameState(sessionId);
  const currentResponses = state?.teamResponses || {};
  await updateGameState(sessionId, {
    teamResponses: { ...currentResponses, [teamId]: response }
  });

  // 2. TeamResponses 탭에 행 단위로 기록 (결과보고서 + 문항별 평가용)
  try {
    const currentTurn = state?.currentTurn || 0;
    const currentCard = state?.currentCard;
    // 세션 이름을 가져와서 세션별 탭에 저장
    const session = await getSession(sessionId);
    await callAPI('saveTeamResponseRow', {
      sessionId,
      sessionName: session?.name || sessionId,
      turn: currentTurn,
      cardTitle: currentCard?.title || '',
      teamId: response.teamId,
      teamName: response.teamName,
      response: response.reasoning || '',
      aiEvaluation: '',
      timestamp: response.submittedAt || Date.now()
    });
  } catch (err) {
    console.error('[Sheets] TeamResponses 행 저장 실패 (비치명적):', err);
  }
}

export async function resetTeamResponses(sessionId: string): Promise<void> {
  await updateGameState(sessionId, {
    teamResponses: {},
    isRevealed: false,
    aiComparativeResult: null,
    isAnalyzing: false
  });
}

export async function setResponsesRevealed(sessionId: string, revealed: boolean): Promise<void> {
  await updateGameState(sessionId, { isRevealed: revealed });
}

export async function saveAIComparativeResult(
  sessionId: string,
  result: AIComparativeResultData
): Promise<void> {
  await updateGameState(sessionId, {
    aiComparativeResult: result,
    isAnalyzing: false
  });
}

// ========================
// TeamResponses 탭 (행 단위 기록)
// ========================

export interface TeamResponseRow {
  sessionId: string;
  turn: number;
  cardTitle: string;
  teamId: string;
  teamName: string;
  response: string;
  aiEvaluation: string;
  timestamp: number;
}

export async function updateTeamResponseAiEvaluation(
  sessionId: string,
  cardTitle: string,
  teamId: string,
  aiEvaluation: string,
  sessionName?: string
): Promise<void> {
  await callAPI('updateTeamResponseAiEvaluation', { sessionId, sessionName, cardTitle, teamId, aiEvaluation });
}

// ========================
// 영토 시스템
// ========================

export async function updateTerritoryOwnership(
  sessionId: string,
  squareIndex: number,
  ownerTeamId: string,
  ownerTeamName: string,
  ownerTeamColor: string
): Promise<void> {
  const state = await getGameState(sessionId);
  const currentTerritories = state?.territories || {};
  await updateGameState(sessionId, {
    territories: {
      ...currentTerritories,
      [squareIndex.toString()]: {
        ownerTeamId,
        ownerTeamName,
        ownerTeamColor,
        acquiredAt: Date.now()
      }
    }
  });
}

export async function updateMultipleTeamScores(
  sessionId: string,
  teamUpdates: { teamId: string; scoreChange: number }[]
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  const updatedTeams = session.teams.map(team => {
    const update = teamUpdates.find(u => u.teamId === team.id);
    if (update) {
      return {
        ...team,
        resources: {
          ...team.resources,
          capital: Math.max(0, team.resources.capital + update.scoreChange)
        }
      };
    }
    return team;
  });

  await updateTeams(sessionId, updatedTeams);
}

// ========================
// 실시간 리스너 (폴링 기반 - 쿼터 절약)
// ========================

function createPoller(
  fetchFn: () => Promise<any>,
  callback: (data: any) => void,
  intervalMs: number,
  label: string
): Unsubscribe {
  let stopped = false;
  let lastData = '';
  let errorCount = 0;

  const poll = async () => {
    if (stopped) return;
    try {
      const data = await fetchFn();
      const json = JSON.stringify(data);
      if (json !== lastData) {
        lastData = json;
        callback(data);
      }
      errorCount = 0; // 성공 시 리셋
    } catch (e) {
      errorCount++;
      console.error(`[Sheets] ${label} poll error (${errorCount}):`, e);
    }
    if (!stopped) {
      // 에러 시 점진적 백오프 (최대 30초)
      const backoff = errorCount > 0 ? Math.min(intervalMs * Math.pow(2, errorCount), 30000) : intervalMs;
      setTimeout(poll, backoff);
    }
  };

  poll();
  return () => { stopped = true; };
}

export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): Unsubscribe {
  return createPoller(
    () => getSession(sessionId),
    callback,
    3000, // 3초 간격
    'subscribeToSession'
  );
}

export function subscribeToGameState(
  sessionId: string,
  callback: (state: GameState | null) => void
): Unsubscribe {
  return createPoller(
    () => getGameState(sessionId),
    callback,
    2000, // 2초 간격
    'subscribeToGameState'
  );
}

export function subscribeToAllSessions(
  callback: (sessions: Session[]) => void
): Unsubscribe {
  return createPoller(
    () => getAllSessions(),
    callback,
    5000, // 5초 간격
    'subscribeToAllSessions'
  );
}
