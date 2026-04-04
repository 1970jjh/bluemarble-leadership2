
// ============================================================
// 커스텀 모드 브루마블 교육게임 타입 정의
// ============================================================

// 커스텀 모드에서는 역량 타입을 문자열로 자유롭게 정의
export type CompetencyType = string;

export enum TeamColor {
  Red = 'Red',
  Blue = 'Blue',
  Green = 'Green',
  Yellow = 'Yellow',
  Purple = 'Purple',
  Orange = 'Orange',
  Pink = 'Pink',
  Teal = 'Teal',
  Cyan = 'Cyan',
  Lime = 'Lime',
  Indigo = 'Indigo',
  Amber = 'Amber',
  Emerald = 'Emerald',
  Slate = 'Slate',
  Rose = 'Rose'
}

// 게임 모드 (커스텀 모드만 지원)
export enum GameVersion {
  Custom = '커스텀'
}

export enum SquareType {
  Start = 'Start',
  City = 'City', // Represents a card square (역량 카드)
}

export interface ResourceState {
  capital: number;      // 자본 (예산/자원)
  energy: number;       // 에너지 (활력)
  reputation: number;   // 평판
  trust: number;        // 신뢰
  competency: number;   // 역량
  insight: number;      // 통찰력
}

export interface Player {
  id: string;
  name: string;
}

export interface TurnRecord {
  turnNumber: number;
  cardId: string;
  cardTitle: string;
  situation: string;
  choiceId: string;
  choiceText: string;
  reasoning: string;
  aiFeedback: string;
  scoreChanges: Partial<ResourceState>;
  timestamp: number;
  position?: number;  // 해당 턴에서 도착한 보드 위치
}

export interface Team {
  id: string;
  name: string;
  color: TeamColor;
  position: number; // 0 to 31
  score: number; // 단일 점수 (시작: 100점)
  resources: ResourceState; // Legacy - 기존 호환용
  isBurnout: boolean;
  burnoutCounter: number;
  lapCount: number;
  members: Player[];
  currentMemberIndex: number; // Who rolls next
  history: TurnRecord[]; // Log of all decisions and AI evaluations
}

export interface BoardSquare {
  index: number;
  type: SquareType;
  name: string;
  price?: number;
  competency?: CompetencyType; // 칸에 해당하는 역량
  description?: string;
}

export interface Choice {
  id: string;
  text: string;
}

// 카드 타입 정의 (커스텀 모드 전용)
export type CardType =
  | 'Custom'         // 커스텀 모드 카드
  | 'Event'          // 우연한 기회 이벤트
  | 'Challenge'      // 도전 과제
  | 'Burnout'        // 번아웃
  | 'Growth'         // 성장 기회
  | 'Special';       // 특별 이벤트

export interface GameCard {
  id: string;
  type: CardType;
  competency?: CompetencyType; // 22개 역량 중 하나 (Event/Challenge/Burnout 등은 없음)
  title: string;
  situation: string;
  choices?: Choice[]; // Optional: If undefined/empty, it's an open-ended input
  learningPoint: string;
}

export interface AIEvaluationResult {
  feedback: string;
  scoreChanges: Partial<ResourceState>;
}

export enum GamePhase {
  Setup = 'Setup',
  Lobby = 'Lobby',
  WaitingToStart = 'WaitingToStart',  // 게임 시작 대기 (관리자가 START 누르기 전)
  Idle = 'Idle',
  Rolling = 'Rolling',
  Moving = 'Moving',
  ShowingDiceResult = 'ShowingDiceResult',  // 주사위 결과 표시 중
  ShowingCompetencyCard = 'ShowingCompetencyCard',  // 역량카드 미리보기 표시 중
  Event = 'Event',
  Decision = 'Decision',
  Result = 'Result',
  Paused = 'Paused',  // 게임 일시정지
  End = 'End',
}

export type SessionStatus = 'active' | 'paused' | 'ended';

export interface Session {
  id: string;
  name: string;
  version: GameVersion;
  teamCount: number;
  status: SessionStatus;
  accessCode: string;
  createdAt: number;
  lastUpdated?: number;  // 마지막 업데이트 시간 (Firebase 동기화용)
  teams: Team[]; // Snapshot of teams in this session
  customCards?: GameCard[];  // 관리자가 수정한 커스텀 카드 (optional)
  customBoardImage?: string;  // 커스텀 모드용 게임판 배경 이미지 URL (optional)
  aiEvaluationGuidelines?: string;  // AI 평가 지침 (수정 가능)
  reportGenerationGuidelines?: string;  // 리포트 생성 지침 (수정 가능)
  singlePieceMode?: boolean;  // 공통 말 모드 (말 1개로 모든 팀이 동시에 문제 풀기)
}

// ============================================================
// 관리자 대시보드 관련 타입
// ============================================================

export interface CardEditHistory {
  cardId: string;
  editedAt: number;
  editedBy: string;
  previousVersion: GameCard;
}

export interface AdminSettings {
  id: string;
  sessionId: string;
  customCards: GameCard[];  // 수정된 카드 목록
  editHistory: CardEditHistory[];  // 수정 이력
  initialResources?: Partial<ResourceState>;  // 커스텀 초기 리소스
  lapBonus?: Partial<ResourceState>;  // 커스텀 한 바퀴 보너스
  doubleBonus?: Partial<ResourceState>;  // 커스텀 더블 보너스
  createdAt: number;
  updatedAt: number;
}

// 역량 정보 (관리자 대시보드용)
export interface CompetencyInfo {
  id: CompetencyType;
  nameKo: string;
  nameEn: string;
  description: string;
}

// ============================================================
// 동시 응답 및 영토 시스템 관련 타입
// ============================================================

// 팀별 응답 (동시 응답 시스템용)
export interface TeamResponse {
  teamId: string;
  teamName: string;
  selectedChoice: Choice | null;
  reasoning: string;
  submittedAt: number;
  isSubmitted: boolean;
}

// AI 비교 분석 결과 (모든 팀 랭킹)
export interface AIComparativeResult {
  rankings: TeamRanking[];
  guidance: string;  // "이럴 땐, 이렇게..." 가이드
  analysisTimestamp: number;
}

// 개별 팀 랭킹
export interface TeamRanking {
  teamId: string;
  teamName: string;
  rank: number;
  score: number;  // 배점 (100, 90, 80, ... 등)
  feedback: string;
  selectedChoice: Choice | null;
  reasoning: string;
}

// 영토 소유권 정보
export interface TerritoryOwnership {
  squareIndex: number;
  ownerTeamId: string | null;
  ownerTeamName: string | null;
  ownerTeamColor: TeamColor | null;
  acquiredAt: number | null;
}

// 세션 확장 - 영토 정보 포함
export interface SessionWithTerritories extends Session {
  territories?: TerritoryOwnership[];
  startingTeamIndex?: number;  // 시작 팀 인덱스 (관리자 선택)
}

// 게임 상태 확장 - 동시 응답 시스템
export interface SimultaneousGameState {
  currentSquareIndex: number;
  currentCard: GameCard | null;
  teamResponses: { [teamId: string]: TeamResponse };
  isRevealed: boolean;  // 관리자가 '공개' 버튼 클릭했는지
  aiAnalysisResult: AIComparativeResult | null;
  isAnalyzing: boolean;  // AI 분석 중
}
