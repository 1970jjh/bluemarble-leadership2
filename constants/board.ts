import { BoardSquare, SquareType } from '../types';

export const BOARD_SIZE = 32;

// ============================================================
// 보드 구성 - 32칸 (출발 1칸 + 카드 31칸)
// 모든 칸이 일반 카드 칸으로 구성됨 (특수 칸 없음)
// ============================================================
export const BOARD_SQUARES: BoardSquare[] = [
  // Bottom Row (Right to Left) - 0~8
  { index: 0, type: SquareType.Start, name: '출발 (Start)' },
  { index: 1, type: SquareType.City, name: '카드 1' },
  { index: 2, type: SquareType.City, name: '카드 2' },
  { index: 3, type: SquareType.City, name: '카드 3' },
  { index: 4, type: SquareType.City, name: '카드 4' },
  { index: 5, type: SquareType.City, name: '카드 5' },
  { index: 6, type: SquareType.City, name: '카드 6' },
  { index: 7, type: SquareType.City, name: '카드 7' },
  { index: 8, type: SquareType.City, name: '카드 8' },

  // Left Column (Bottom to Top) - 9~15
  { index: 9, type: SquareType.City, name: '카드 9' },
  { index: 10, type: SquareType.City, name: '카드 10' },
  { index: 11, type: SquareType.City, name: '카드 11' },
  { index: 12, type: SquareType.City, name: '카드 12' },
  { index: 13, type: SquareType.City, name: '카드 13' },
  { index: 14, type: SquareType.City, name: '카드 14' },
  { index: 15, type: SquareType.City, name: '카드 15' },

  // Top Row (Left to Right) - 16~23
  { index: 16, type: SquareType.City, name: '카드 16' },
  { index: 17, type: SquareType.City, name: '카드 17' },
  { index: 18, type: SquareType.City, name: '카드 18' },
  { index: 19, type: SquareType.City, name: '카드 19' },
  { index: 20, type: SquareType.City, name: '카드 20' },
  { index: 21, type: SquareType.City, name: '카드 21' },
  { index: 22, type: SquareType.City, name: '카드 22' },
  { index: 23, type: SquareType.City, name: '카드 23' },

  // Right Column (Top to Bottom) - 24~31
  { index: 24, type: SquareType.City, name: '카드 24' },
  { index: 25, type: SquareType.City, name: '카드 25' },
  { index: 26, type: SquareType.City, name: '카드 26' },
  { index: 27, type: SquareType.City, name: '카드 27' },
  { index: 28, type: SquareType.City, name: '카드 28' },
  { index: 29, type: SquareType.City, name: '카드 29' },
  { index: 30, type: SquareType.City, name: '카드 30' },
  { index: 31, type: SquareType.City, name: '카드 31' },
];

// ============================================================
// 커스텀 모드용 보드 칸 기본 이름 (관리자가 JSON으로 설정 가능)
// 31개 카드 칸 (출발 칸 제외)
// ============================================================
export const CUSTOM_BOARD_NAMES: Record<number, string> = {
  1: '카드 1',
  2: '카드 2',
  3: '카드 3',
  4: '카드 4',
  5: '카드 5',
  6: '카드 6',
  7: '카드 7',
  8: '카드 8',
  9: '카드 9',
  10: '카드 10',
  11: '카드 11',
  12: '카드 12',
  13: '카드 13',
  14: '카드 14',
  15: '카드 15',
  16: '카드 16',
  17: '카드 17',
  18: '카드 18',
  19: '카드 19',
  20: '카드 20',
  21: '카드 21',
  22: '카드 22',
  23: '카드 23',
  24: '카드 24',
  25: '카드 25',
  26: '카드 26',
  27: '카드 27',
  28: '카드 28',
  29: '카드 29',
  30: '카드 30',
  31: '카드 31',
};
