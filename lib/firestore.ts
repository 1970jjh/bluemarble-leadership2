// Google Apps Script 기반 데이터베이스 서비스
// Firebase Firestore 대신 Google Sheets를 백엔드로 사용
import { gasService } from './gasService';
import type { Session, Team, TurnRecord, GamePhase, SessionStatus } from '../types';

// Unsubscribe 타입 (폴링 타이머 해제용)
type Unsubscribe = () => void;

// ========================
// 세션(Session) 관련 함수
// ========================

// 새 세션 생성
export async function createSession(session: Session): Promise<void> {
  const sessionWithTimestamp = {
    ...session,
    createdAt: Date.now(),
  };
  const gameState: GameState = {
    sessionId: session.id,
    phase: 'Idle',
    currentTeamIndex: 0,
    currentTurn: 0,
    diceValue: [0, 0],
    currentCard: null,
    selectedChoice: null,
    reasoning: '',
    aiResult: null,
    isSubmitted: false,
    isAiProcessing: false,
    isGameStarted: false,
    gameLogs: [],
    lastUpdated: Date.now(),
  };
  await gasService.createSession(
    JSON.stringify(sessionWithTimestamp),
    JSON.stringify(gameState)
  );
}

// 세션 가져오기
export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await gasService.getSession(sessionId);
  if (result.success && result.data) {
    return result.data as Session;
  }
  return null;
}

// 접근 코드로 세션 찾기
export async function getSessionByAccessCode(accessCode: string): Promise<Session | null> {
  const result = await gasService.getSessionByAccessCode(accessCode);
  if (result.success && result.data) {
    return result.data as Session;
  }
  return null;
}

// 모든 세션 가져오기
export async function getAllSessions(): Promise<Session[]> {
  const result = await gasService.getAllSessions();
  if (result.success && result.data) {
    return result.data as Session[];
  }
  return [];
}

// 세션 업데이트
export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
  // 현재 세션을 가져와서 merge 후 저장
  const current = await getSession(sessionId);
  if (!current) return;

  const updated = { ...current, ...updates, lastUpdated: Date.now() };
  await gasService.updateSession(sessionId, JSON.stringify(updated));
}

// 세션 삭제
export async function deleteSession(sessionId: string): Promise<void> {
  await gasService.deleteSession(sessionId);
}

// 세션 상태 변경
export async function updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
  await updateSession(sessionId, { status });
}

// ========================
// 팀(Team) 관련 함수
// ========================

// 팀 정보 업데이트 (세션 내의 teams 배열 업데이트)
export async function updateTeams(sessionId: string, teams: Team[]): Promise<void> {
  await updateSession(sessionId, { teams, lastUpdated: Date.now() });
}

// 특정 팀 업데이트
export async function updateTeam(sessionId: string, teamId: string, updates: Partial<Team>): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  const updatedTeams = session.teams.map(team =>
    team.id === teamId ? { ...team, ...updates } : team
  );

  await updateTeams(sessionId, updatedTeams);
}

// 팀 턴 기록 추가
export async function addTurnRecord(sessionId: string, teamId: string, record: TurnRecord): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  const updatedTeams = session.teams.map(team => {
    if (team.id === teamId) {
      return {
        ...team,
        history: [...team.history, record]
      };
    }
    return team;
  });

  await updateTeams(sessionId, updatedTeams);

  // TurnLog 시트에도 기록 (Google Sheets에서 열람 가능)
  const team = session.teams.find(t => t.id === teamId);
  gasService.appendTurnLog({
    sessionId,
    sessionName: session.name,
    teamName: team?.name || '',
    turnNumber: record.turnNumber,
    position: record.position || 0,
    cardTitle: record.cardTitle,
    situation: record.situation,
    choiceText: record.choiceText,
    reasoning: record.reasoning,
    aiFeedback: record.aiFeedback,
    scoreChange: JSON.stringify(record.scoreChanges),
  }).catch(() => {}); // 로그 실패는 무시
}

// ========================
// 게임 상태(GameState) 관련 함수
// ========================

// 팀별 응답 (동시 응답 시스템용)
export interface TeamResponseData {
  teamId: string;
  teamName: string;
  selectedChoice: { id: string; text: string } | null;
  reasoning: string;
  submittedAt: number;
  isSubmitted: boolean;
}

// 팀 랭킹 (AI 비교 분석 결과)
export interface TeamRankingData {
  teamId: string;
  teamName: string;
  rank: number;
  score: number;
  feedback: string;
  selectedChoice: { id: string; text: string } | null;
  reasoning: string;
}

// AI 비교 분석 결과
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
  turnVersion?: number;
}

// 게임 상태 저장/업데이트
export async function saveGameState(state: GameState): Promise<void> {
  const stateWithTimestamp = { ...state, lastUpdated: Date.now() };
  await gasService.updateGameState(
    state.sessionId,
    JSON.stringify(stateWithTimestamp),
    true
  );
}

// 게임 상태 부분 업데이트 (merge)
export async function updateGameState(sessionId: string, updates: Partial<GameState>): Promise<void> {
  const updatesWithTimestamp = { ...updates, lastUpdated: Date.now() };
  await gasService.updateGameState(
    sessionId,
    JSON.stringify(updatesWithTimestamp),
    true
  );
}

// 게임 상태 가져오기
export async function getGameState(sessionId: string): Promise<GameState | null> {
  const result = await gasService.getGameState(sessionId);
  if (result.success && result.data) {
    return result.data as GameState;
  }
  return null;
}

// 게임 로그 추가
export async function addGameLog(sessionId: string, log: string): Promise<void> {
  const state = await getGameState(sessionId);
  const currentLogs = state?.gameLogs || [];
  await updateGameState(sessionId, {
    gameLogs: [...currentLogs, `[${new Date().toLocaleTimeString()}] ${log}`]
  });
}

// 관람자 투표 업데이트
export async function updateSpectatorVote(
  sessionId: string,
  optionId: string,
  previousOptionId: string | null,
  teamName: string
): Promise<void> {
  const state = await getGameState(sessionId);
  const currentVotes: { [key: string]: string[] } = {};

  if (state?.spectatorVotes) {
    Object.keys(state.spectatorVotes).forEach(key => {
      currentVotes[key] = [...(state.spectatorVotes![key] || [])];
    });
  }

  if (previousOptionId && currentVotes[previousOptionId]) {
    currentVotes[previousOptionId] = currentVotes[previousOptionId].filter(name => name !== teamName);
  }

  if (!currentVotes[optionId]) {
    currentVotes[optionId] = [];
  }
  if (!currentVotes[optionId].includes(teamName)) {
    currentVotes[optionId].push(teamName);
  }

  await updateGameState(sessionId, {
    spectatorVotes: currentVotes
  });
}

// ========================
// 동시 응답 시스템 함수
// ========================

// 팀 응답 저장/업데이트
export async function updateTeamResponse(
  sessionId: string,
  teamId: string,
  response: TeamResponseData
): Promise<void> {
  const state = await getGameState(sessionId);
  const currentResponses = state?.teamResponses || {};
  await updateGameState(sessionId, {
    teamResponses: {
      ...currentResponses,
      [teamId]: response
    }
  });
}

// 모든 팀 응답 초기화
export async function resetTeamResponses(sessionId: string): Promise<void> {
  await updateGameState(sessionId, {
    teamResponses: {},
    isRevealed: false,
    aiComparativeResult: null,
    isAnalyzing: false
  });
}

// 응답 공개 상태 업데이트
export async function setResponsesRevealed(sessionId: string, revealed: boolean): Promise<void> {
  await updateGameState(sessionId, {
    isRevealed: revealed
  });
}

// AI 비교 분석 결과 저장
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
// 영토 시스템 함수
// ========================

// 영토 소유권 업데이트
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

// 여러 팀 점수 동시 업데이트
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

// 영토 정보 조회
export async function getTerritoryOwner(
  sessionId: string,
  squareIndex: number
): Promise<{ ownerTeamId: string; ownerTeamName: string; ownerTeamColor: string } | null> {
  const state = await getGameState(sessionId);
  const territory = state?.territories?.[squareIndex.toString()];
  return territory || null;
}

// ========================
// 실시간 리스너 함수 (폴링 기반)
// ========================

const POLL_INTERVAL = 2000; // 2초 간격 폴링

// 세션 실시간 구독 (폴링)
export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): Unsubscribe {
  let active = true;
  let lastJson = '';

  const poll = async () => {
    if (!active) return;
    try {
      const session = await getSession(sessionId);
      const json = JSON.stringify(session);
      if (json !== lastJson) {
        lastJson = json;
        callback(session);
      }
    } catch (e) {
      console.error('세션 폴링 오류:', e);
    }
    if (active) {
      setTimeout(poll, POLL_INTERVAL);
    }
  };

  poll();

  return () => { active = false; };
}

// 게임 상태 실시간 구독 (폴링)
export function subscribeToGameState(
  sessionId: string,
  callback: (state: GameState | null) => void
): Unsubscribe {
  let active = true;
  let lastJson = '';

  const poll = async () => {
    if (!active) return;
    try {
      const state = await getGameState(sessionId);
      const json = JSON.stringify(state);
      if (json !== lastJson) {
        lastJson = json;
        callback(state);
      }
    } catch (e) {
      console.error('게임 상태 폴링 오류:', e);
    }
    if (active) {
      setTimeout(poll, POLL_INTERVAL);
    }
  };

  poll();

  return () => { active = false; };
}

// 모든 세션 실시간 구독 (폴링)
export function subscribeToAllSessions(
  callback: (sessions: Session[]) => void
): Unsubscribe {
  let active = true;
  let lastJson = '';

  const poll = async () => {
    if (!active) return;
    try {
      const sessions = await getAllSessions();
      const json = JSON.stringify(sessions);
      if (json !== lastJson) {
        lastJson = json;
        callback(sessions);
      }
    } catch (e) {
      console.error('전체 세션 폴링 오류:', e);
    }
    if (active) {
      setTimeout(poll, POLL_INTERVAL);
    }
  };

  poll();

  return () => { active = false; };
}
