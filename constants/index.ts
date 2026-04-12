import { GameCard, ResourceState } from '../types';

// ============================================================
// 모든 constants 모듈 re-export (커스텀 모드 전용)
// ============================================================
export { BOARD_SIZE, BOARD_SQUARES, CUSTOM_BOARD_NAMES } from './board';
export { COMPETENCY_INFO } from './competencyInfo';
export { EVENT_CARDS } from './eventCards';

// 개별 import (내부 사용)
import { BOARD_SQUARES, CUSTOM_BOARD_NAMES } from './board';
import { EVENT_CARDS } from './eventCards';

// ============================================================
// 초기 점수 및 리소스 설정
// ============================================================

// 단일 점수 체계 - 시작 점수 100점
export const INITIAL_SCORE = 100;

// Legacy 호환용 - 기존 리소스 상태
export const INITIAL_RESOURCES: ResourceState = {
  capital: 50,    // 자본 (시작: 50)
  energy: 50,     // 에너지 (시작: 50)
  reputation: 30, // 평판 (시작: 30, 목표: 100)
  trust: 30,      // 신뢰 (시작: 30, 목표: 100)
  competency: 30, // 역량 (시작: 30, 목표: 100)
  insight: 30,    // 통찰력 (시작: 30, 목표: 100)
};

// 한 바퀴 완주 보너스 - 완주한 팀에게 +60점
export const LAP_BONUS_POINTS = 60;  // 완주 보너스 점수

// Legacy 호환용 (기존 코드 호환)
export const LAP_BONUS_PER_TEAM = 20;  // 사용되지 않음

// 더블 보너스 (주사위 2개 같은 숫자) - 평점 30점
export const DOUBLE_BONUS_POINTS = 30;

// Legacy 호환용 (기존 코드 호환)
export const LAP_BONUS: Partial<ResourceState> = {
  energy: 0,
  trust: 0,
  competency: 0,
  insight: 0,
};

export const DOUBLE_BONUS: Partial<ResourceState> = {
  energy: 0,
  trust: 0,
  competency: 0,
  insight: 0,
};

// ============================================================
// 전체 카드 통합 (커스텀 모드에서는 이벤트 카드만 기본 제공)
// ============================================================
export const SAMPLE_CARDS: GameCard[] = [
  ...EVENT_CARDS,
];

// ============================================================
// 헬퍼 함수들 (커스텀 모드 전용)
// ============================================================

// 보드 칸 이름 가져오기
export const getSquareName = (squareIndex: number): string => {
  const square = BOARD_SQUARES.find(s => s.index === squareIndex);
  if (!square) return '';
  return CUSTOM_BOARD_NAMES[squareIndex] || square.name;
};

// 찬스카드 인덱스 순서 (출발선 기준)
export const CHANCE_CARD_SQUARES = [2, 7, 12, 19, 31];

// 찬스카드 타입 판별 (1/3/5번째는 복권 보너스, 2/4번째는 리스크 카드)
export const getChanceCardType = (squareIndex: number): 'lottery' | 'risk' | null => {
  const order = CHANCE_CARD_SQUARES.indexOf(squareIndex);
  if (order === -1) return null;

  // 1번째, 3번째, 5번째 (index 0, 2, 4) → 복권 보너스
  // 2번째, 4번째 (index 1, 3) → 리스크 카드
  return (order % 2 === 0) ? 'lottery' : 'risk';
};

// 팀별 캐릭터 이미지 (8개)
export const CHARACTER_IMAGES = [
  'https://i.ibb.co/RGcCcwBf/1.png',  // 1조
  'https://i.ibb.co/MkKQpP8W/2.png',  // 2조
  'https://i.ibb.co/KpF32MRT/3.png',  // 3조
  'https://i.ibb.co/5XvVbLmQ/4.png',  // 4조
  'https://i.ibb.co/Y43M160r/5.png',  // 5조
  'https://i.ibb.co/hRZ7RJZ4/6.png',  // 6조
  'https://i.ibb.co/BH7hrmDZ/7.png',  // 7조
  'https://i.ibb.co/kgqKfW7Q/8.png',  // 8조
];

// 팀 번호로 캐릭터 이미지 가져오기
export const getCharacterImage = (teamNumber: number): string => {
  const index = (teamNumber - 1) % CHARACTER_IMAGES.length;
  return CHARACTER_IMAGES[index];
};

// ============================================================
// AI 평가 및 리포트 생성 기본 지침
// ============================================================

// 기본 AI 평가 지침
export const DEFAULT_AI_EVALUATION_GUIDELINES = `## 평가 기준 (중요도 순) - 자유 서술 기반

### 🚨 1순위: 성의 있는 답변인가? (필수 조건)
- 의미 없는 글자 나열 (예: "ㅁㄴㄹㅇ", "asdf", "ㅋㅋㅋ", "..." 등) → 무조건 최하위, 0~20점
- 너무 짧은 답변 (3단어 미만, 10글자 미만) → 큰 감점
- 질문과 무관한 답변 → 최하위

### ⭐ 2순위: 서술 내용의 질 (가장 중요한 평가 요소!)
1. 행동의 구체성: 자신이 취할 행동을 구체적으로 서술했는가? (최중요)
2. 이유의 논리성: 왜 그렇게 행동하는지 논리적 근거가 있는가?
3. 상황 맥락 이해: 주어진 상황의 핵심을 파악하고 적절히 대응했는가?
4. 깊이: 단순한 답변이 아닌, 깊이 있는 사고가 담겨 있는가?

### 📋 3순위: 리더십/팀워크 관점
- 리더십, 협업, 소통 등의 역량이 드러나는가?
- 팀원이나 이해관계자를 고려한 판단인가?
- (단, 서술이 충실하다면 다소 다른 관점이어도 감점 폭이 적음)

### 점수 결정 원칙
- 구체적 행동 + 논리적 이유 + 상황 이해 = 최고점 (100점)
- 행동은 있으나 이유가 부족 = 높은 점수 (70~85점)
- 짧지만 핵심을 담은 답변 = 중간 점수 (50~70점)
- 짧고 모호한 답변 = 낮은 점수 (30~50점)
- 성의 없는 답변 = 최하점 (0~20점)`;

// 기본 리포트 생성 지침
export const DEFAULT_REPORT_GENERATION_GUIDELINES = `## 팀별 리포트 작성 기준

a) 시스템 로그 기록을 기반으로 각 팀별로 수행한 상황+옵션/이유+AI분석내용을 표로 작성

b) 각 팀의 전체 라운드 응답 패턴 분석 (200-300자)
   - 일관된 의사결정 패턴이 있는지
   - 어떤 가치관/성향을 보여주는지
   - 시간이 지나면서 변화가 있었는지

c) 각 팀별 강점과 개선점에 대한 피드백 제공 (600-800자)
   - 구체적인 사례를 들어 피드백 제공
   - 강점을 먼저 언급하고 개선점 제시
   - 건설적이고 동기부여가 되는 톤 유지
   - 실제 업무/일상에 적용할 수 있는 조언 포함

d) 각 팀의 응답 이유와 AI분석 결과를 기반으로, 팀별로 커스터마이징된 팀 토의 주제 3가지를 질문형 문장으로 제시
   - 팀의 실제 응답과 관련된 구체적인 질문
   - 팀원들이 서로 토론하기 좋은 개방형 질문
   - 자기성찰과 개선을 유도하는 질문`;
