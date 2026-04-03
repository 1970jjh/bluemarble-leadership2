import {
  BoardSquare,
  SquareType,
  ResourceState,
  GameCard,
} from '../types';

// ============================================================
// Board & Game Constants
// ============================================================

export const BOARD_SIZE = 32;
export const INITIAL_SCORE = 100;
export const LAP_BONUS_POINTS = 60;

export const INITIAL_RESOURCES: ResourceState = {
  capital: 50,
  energy: 50,
  reputation: 50,
  trust: 50,
  competency: 50,
  insight: 50,
};

// ============================================================
// Board Squares (32 squares: index 0 = Start, 1-31 = City)
// ============================================================

export const BOARD_SQUARES: BoardSquare[] = [
  { index: 0, type: SquareType.Start, name: '출발 (Start)', description: '출발점입니다. 한 바퀴를 돌면 보너스를 받습니다.' },
  { index: 1, type: SquareType.City, name: '자기 인식 (Self-Awareness)', competency: '자기 인식', description: '자신의 강점, 약점, 감정, 가치관을 이해하는 능력입니다.' },
  { index: 2, type: SquareType.City, name: '감정 조절 (Emotional Regulation)', competency: '감정 조절', description: '감정을 인식하고 적절하게 관리하는 능력입니다.' },
  { index: 3, type: SquareType.City, name: '동기 부여 (Motivation)', competency: '동기 부여', description: '자신과 타인에게 동기를 부여하고 목표를 향해 나아가는 능력입니다.' },
  { index: 4, type: SquareType.City, name: '의사소통 (Communication)', competency: '의사소통', description: '효과적으로 메시지를 전달하고 경청하는 능력입니다.' },
  { index: 5, type: SquareType.City, name: '갈등 관리 (Conflict Management)', competency: '갈등 관리', description: '갈등 상황을 건설적으로 해결하는 능력입니다.' },
  { index: 6, type: SquareType.City, name: '팀워크 (Teamwork)', competency: '팀워크', description: '팀원들과 협력하여 공동의 목표를 달성하는 능력입니다.' },
  { index: 7, type: SquareType.City, name: '비전 설정 (Vision Setting)', competency: '비전 설정', description: '조직의 미래 방향을 설정하고 공유하는 능력입니다.' },
  { index: 8, type: SquareType.City, name: '변화 관리 (Change Management)', competency: '변화 관리', description: '변화를 주도하고 조직을 새로운 방향으로 이끄는 능력입니다.' },
  { index: 9, type: SquareType.City, name: '의사결정 (Decision Making)', competency: '의사결정', description: '정보를 분석하고 최적의 결정을 내리는 능력입니다.' },
  { index: 10, type: SquareType.City, name: '문제 해결 (Problem Solving)', competency: '문제 해결', description: '문제를 체계적으로 분석하고 해결책을 찾는 능력입니다.' },
  { index: 11, type: SquareType.City, name: '창의적 사고 (Creative Thinking)', competency: '창의적 사고', description: '새로운 아이디어를 생성하고 혁신적인 접근을 하는 능력입니다.' },
  { index: 12, type: SquareType.City, name: '전략적 사고 (Strategic Thinking)', competency: '전략적 사고', description: '장기적인 관점에서 전략을 수립하고 실행하는 능력입니다.' },
  { index: 13, type: SquareType.City, name: '시간 관리 (Time Management)', competency: '시간 관리', description: '시간을 효율적으로 배분하고 우선순위를 정하는 능력입니다.' },
  { index: 14, type: SquareType.City, name: '스트레스 관리 (Stress Management)', competency: '스트레스 관리', description: '스트레스를 인식하고 건강하게 대처하는 능력입니다.' },
  { index: 15, type: SquareType.City, name: '코칭 (Coaching)', competency: '코칭', description: '타인의 성장과 발전을 돕는 능력입니다.' },
  { index: 16, type: SquareType.City, name: '멘토링 (Mentoring)', competency: '멘토링', description: '경험과 지식을 공유하여 후배를 양성하는 능력입니다.' },
  { index: 17, type: SquareType.City, name: '피드백 (Feedback)', competency: '피드백', description: '건설적인 피드백을 주고받는 능력입니다.' },
  { index: 18, type: SquareType.City, name: '위임 (Delegation)', competency: '위임', description: '적절하게 업무를 위임하고 권한을 부여하는 능력입니다.' },
  { index: 19, type: SquareType.City, name: '협상 (Negotiation)', competency: '협상', description: '상호 이익을 위해 효과적으로 협상하는 능력입니다.' },
  { index: 20, type: SquareType.City, name: '설득 (Persuasion)', competency: '설득', description: '논리와 감성을 활용하여 타인을 설득하는 능력입니다.' },
  { index: 21, type: SquareType.City, name: '네트워킹 (Networking)', competency: '네트워킹', description: '인적 네트워크를 구축하고 관계를 유지하는 능력입니다.' },
  { index: 22, type: SquareType.City, name: '자기 개발 (Self-Development)', competency: '자기 개발', description: '지속적으로 자신을 발전시키고 학습하는 능력입니다.' },
  { index: 23, type: SquareType.City, name: '회복탄력성 (Resilience)', competency: '회복탄력성', description: '어려움을 극복하고 빠르게 회복하는 능력입니다.' },
  { index: 24, type: SquareType.City, name: '윤리적 리더십 (Ethical Leadership)', competency: '윤리적 리더십', description: '윤리적 원칙에 기반하여 리더십을 발휘하는 능력입니다.' },
  { index: 25, type: SquareType.City, name: '다양성 존중 (Diversity & Inclusion)', competency: '다양성 존중', description: '다양한 배경과 관점을 존중하고 포용하는 능력입니다.' },
  { index: 26, type: SquareType.City, name: '혁신 (Innovation)', competency: '혁신', description: '새로운 가치를 창출하고 변화를 이끄는 능력입니다.' },
  { index: 27, type: SquareType.City, name: '조직문화 (Organizational Culture)', competency: '조직문화', description: '건강한 조직문화를 형성하고 유지하는 능력입니다.' },
  { index: 28, type: SquareType.City, name: '성과관리 (Performance Management)', competency: '성과관리', description: '목표를 설정하고 성과를 체계적으로 관리하는 능력입니다.' },
  { index: 29, type: SquareType.City, name: '목표설정 (Goal Setting)', competency: '목표설정', description: 'SMART 원칙에 따라 명확한 목표를 설정하는 능력입니다.' },
  { index: 30, type: SquareType.City, name: '자기효능감 (Self-Efficacy)', competency: '자기효능감', description: '자신의 능력에 대한 믿음과 도전하는 자세입니다.' },
  { index: 31, type: SquareType.City, name: '공감 능력 (Empathy)', competency: '공감 능력', description: '타인의 감정과 상황을 이해하고 공감하는 능력입니다.' },
];

// ============================================================
// Cards
// ============================================================

export const SAMPLE_CARDS: GameCard[] = [];

export const EVENT_CARDS: GameCard[] = [
  {
    id: 'event-001',
    type: 'Custom',
    competency: '의사소통',
    title: '팀 갈등 상황',
    situation: '당신의 팀에서 두 명의 핵심 멤버가 프로젝트 방향에 대해 심하게 대립하고 있습니다. 회의 분위기가 험악해지고 있으며, 다른 팀원들도 불안해하고 있습니다.',
    choices: [
      { id: 'event-001-a', text: '즉시 회의를 중단하고 두 사람을 개별적으로 만나 이야기를 듣는다.' },
      { id: 'event-001-b', text: '팀 전체가 참여하는 브레인스토밍을 통해 새로운 대안을 모색한다.' },
      { id: 'event-001-c', text: '객관적인 데이터와 근거를 제시하며 논리적으로 방향을 제안한다.' },
    ],
    learningPoint: '갈등 상황에서 리더는 감정을 조절하고, 모든 관점을 경청한 후 건설적인 해결책을 찾아야 합니다.',
  },
  {
    id: 'event-002',
    type: 'Custom',
    competency: '변화 관리',
    title: '조직 변화 저항',
    situation: '회사가 새로운 디지털 시스템을 도입하기로 결정했습니다. 그러나 많은 직원들이 기존 방식에 익숙하여 변화에 강하게 저항하고 있습니다.',
    choices: [
      { id: 'event-002-a', text: '변화의 필요성과 비전을 명확하게 설명하는 타운홀 미팅을 개최한다.' },
      { id: 'event-002-b', text: '변화 챔피언을 선정하고 단계적 도입 계획을 수립한다.' },
      { id: 'event-002-c', text: '저항하는 직원들의 우려를 경청하고 교육 프로그램을 마련한다.' },
    ],
    learningPoint: '변화 관리에서는 구성원들의 저항을 이해하고, 소통과 참여를 통해 점진적으로 변화를 이끌어야 합니다.',
  },
  {
    id: 'event-003',
    type: 'Custom',
    competency: '윤리적 리더십',
    title: '윤리적 딜레마',
    situation: '주요 거래처가 계약 조건에 포함되지 않은 특별한 편의를 요구하고 있습니다. 이를 거절하면 큰 계약을 잃을 수 있지만, 수락하면 공정성에 문제가 생길 수 있습니다.',
    choices: [
      { id: 'event-003-a', text: '원칙을 지키며 정중하게 거절하고, 대안적인 협력 방안을 제시한다.' },
      { id: 'event-003-b', text: '상급자에게 보고하고 조직 차원의 의사결정을 요청한다.' },
      { id: 'event-003-c', text: '법적/윤리적 검토를 거친 후, 투명하게 처리할 수 있는 범위를 제안한다.' },
    ],
    learningPoint: '윤리적 리더십은 단기적 이익보다 장기적 신뢰를 우선시하며, 원칙에 기반한 의사결정을 하는 것입니다.',
  },
  {
    id: 'event-004',
    type: 'Custom',
    competency: '코칭',
    title: '성과 부진 팀원',
    situation: '최근 3개월간 성과가 크게 떨어진 팀원이 있습니다. 동료들 사이에서도 불만이 나오고 있지만, 해당 팀원은 개인적인 어려움을 겪고 있는 것 같습니다.',
    choices: [
      { id: 'event-004-a', text: '1:1 면담을 통해 상황을 파악하고, 함께 개선 계획을 수립한다.' },
      { id: 'event-004-b', text: '성과 개선 목표를 명확히 설정하고, 정기적인 피드백 세션을 진행한다.' },
      { id: 'event-004-c', text: '업무 부담을 조정하고, 멘토를 배정하여 지원 체계를 마련한다.' },
    ],
    learningPoint: '효과적인 코칭은 성과와 인간적 배려의 균형을 찾으며, 개인의 성장을 지원하는 것입니다.',
  },
  {
    id: 'event-005',
    type: 'Custom',
    competency: '전략적 사고',
    title: '시장 위기 대응',
    situation: '경쟁사가 혁신적인 제품을 출시하면서 당신의 회사 시장 점유율이 빠르게 하락하고 있습니다. 경영진은 빠른 대응을 요구하고 있습니다.',
    choices: [
      { id: 'event-005-a', text: '시장 분석을 통해 차별화 전략을 수립하고, R&D 투자를 확대한다.' },
      { id: 'event-005-b', text: '고객 피드백을 수집하고, 기존 제품의 빠른 개선에 집중한다.' },
      { id: 'event-005-c', text: '전략적 파트너십이나 M&A를 통해 경쟁력을 확보한다.' },
    ],
    learningPoint: '전략적 사고는 위기 상황에서도 장기적 관점을 유지하며, 데이터에 기반한 의사결정을 하는 것입니다.',
  },
  {
    id: 'event-006',
    type: 'Custom',
    competency: '다양성 존중',
    title: '다양성 이슈',
    situation: '새로 합류한 외국인 팀원이 문화적 차이로 인해 팀에 적응하지 못하고 있습니다. 일부 팀원들이 은연중에 배타적인 태도를 보이고 있습니다.',
    choices: [
      { id: 'event-006-a', text: '다양성 교육 워크숍을 진행하고, 팀 내 포용적 문화를 조성한다.' },
      { id: 'event-006-b', text: '버디 시스템을 도입하고, 새 팀원의 적응을 적극 지원한다.' },
      { id: 'event-006-c', text: '팀 빌딩 활동을 통해 서로를 이해하는 시간을 만든다.' },
    ],
    learningPoint: '다양성 존중은 차이를 인정하고 포용하며, 모든 구성원이 존중받는 환경을 만드는 것입니다.',
  },
  {
    id: 'event-007',
    type: 'Custom',
    competency: '회복탄력성',
    title: '프로젝트 실패',
    situation: '6개월간 진행한 대형 프로젝트가 예상치 못한 문제로 실패했습니다. 팀 사기가 크게 떨어졌고, 경영진의 신뢰도 흔들리고 있습니다.',
    choices: [
      { id: 'event-007-a', text: '실패 원인을 분석하는 회고 미팅을 진행하고, 교훈을 도출한다.' },
      { id: 'event-007-b', text: '팀원들의 노력을 인정하고, 다음 기회를 위한 비전을 제시한다.' },
      { id: 'event-007-c', text: '작은 성공 경험을 만들 수 있는 단기 프로젝트를 기획한다.' },
    ],
    learningPoint: '회복탄력성은 실패에서 배우고, 팀의 사기를 회복시키며, 더 강해지는 능력입니다.',
  },
];

// ============================================================
// Chance Card Squares & Utility
// ============================================================

export const CHANCE_CARD_SQUARES: number[] = [4, 12, 20, 28];

export function getChanceCardType(cardNumber: number): 'lottery' | 'risk' {
  return cardNumber % 2 !== 0 ? 'lottery' : 'risk';
}

// ============================================================
// Default AI Evaluation Guidelines
// ============================================================

export const DEFAULT_AI_EVALUATION_GUIDELINES: string = `리더십 교육 게임 AI 평가 지침

1. 평가 기준:
   - 리더십 역량의 적절한 발휘 여부
   - 상황에 대한 이해도와 분석력
   - 선택의 논리적 근거와 타당성
   - 팀원/조직에 대한 배려와 영향력
   - 장기적 관점에서의 의사결정

2. 점수 부여 기준 (각 리소스 -20 ~ +20):
   - 탁월한 리더십 발휘: +15 ~ +20
   - 우수한 판단: +10 ~ +15
   - 적절한 대응: +5 ~ +10
   - 보통 수준: 0 ~ +5
   - 미흡한 판단: -5 ~ -10
   - 부적절한 대응: -10 ~ -20

3. 피드백 작성 지침:
   - 한국어로 작성
   - 선택의 장점과 개선점을 균형있게 제시
   - 구체적인 리더십 이론이나 모델 참조
   - 실무에 적용 가능한 조언 포함
   - 격려와 발전적 피드백 제공

4. 특별 고려사항:
   - 상황의 긴급성과 중요도 반영
   - 다양한 이해관계자의 관점 고려
   - 윤리적 측면의 판단 중시
   - 창의적이고 혁신적인 접근 가산점`;
