import React from 'react';
import { Team, BoardSquare, GameCard, TeamColor } from '../types';
import { BOARD_SQUARES } from '../constants';

// ============================================================
// Multiplier Squares
// ============================================================

export const DOUBLE_SQUARES = [8, 24]; // x2 multiplier squares
export const TRIPLE_SQUARES = [16]; // x3 multiplier squares

export const getSquareMultiplier = (squareIndex: number): number => {
  if (TRIPLE_SQUARES.includes(squareIndex)) return 3;
  if (DOUBLE_SQUARES.includes(squareIndex)) return 2;
  return 1;
};

// ============================================================
// Color mapping
// ============================================================

const TEAM_COLOR_CSS: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  Yellow: '#eab308',
  Purple: '#a855f7',
  Orange: '#f97316',
  Pink: '#ec4899',
  Teal: '#14b8a6',
  Cyan: '#06b6d4',
  Lime: '#84cc16',
  Indigo: '#6366f1',
  Amber: '#f59e0b',
  Emerald: '#10b981',
  Slate: '#64748b',
  Rose: '#f43f5e',
};

function getColorCSS(color: TeamColor | string): string {
  return TEAM_COLOR_CSS[color] || '#6b7280';
}

// ============================================================
// Props
// ============================================================

interface GameBoardProps {
  teams: Team[];
  onSquareClick: (square: BoardSquare) => void;
  gameMode: string;
  customBoardImage?: string;
  customCards: GameCard[];
  territories: {
    [squareIndex: string]: {
      ownerTeamId: string;
      ownerTeamName: string;
      ownerTeamColor: string;
      acquiredAt: number;
    };
  };
  singlePieceMode?: boolean;
}

// ============================================================
// Board layout helpers
// ============================================================

// Bottom row (left to right): 0-8
// Right column (bottom to top): 9-15
// Top row (right to left): 16-23
// Left column (top to bottom): 24-31

function getSquarePosition(
  index: number
): { row: number; col: number; side: 'bottom' | 'right' | 'top' | 'left' } {
  if (index >= 0 && index <= 8) {
    return { row: 8, col: index, side: 'bottom' };
  } else if (index >= 9 && index <= 15) {
    return { row: 8 - (index - 8), col: 9, side: 'right' };
  } else if (index >= 16 && index <= 23) {
    return { row: 0, col: 9 - (index - 15), side: 'top' };
  } else {
    return { row: index - 23, col: 0, side: 'left' };
  }
}

// ============================================================
// Square Component
// ============================================================

interface SquareProps {
  square: BoardSquare;
  teamsOnSquare: Team[];
  territory?: {
    ownerTeamId: string;
    ownerTeamName: string;
    ownerTeamColor: string;
    acquiredAt: number;
  };
  multiplier: number;
  onClick: () => void;
  side: 'bottom' | 'right' | 'top' | 'left';
}

const Square: React.FC<SquareProps> = ({
  square,
  teamsOnSquare,
  territory,
  multiplier,
  onClick,
  side,
}) => {
  const isCorner =
    (side === 'bottom' && (square.index === 0 || square.index === 8)) ||
    (side === 'top' && (square.index === 16 || square.index === 23)) ||
    (side === 'right' && square.index === 15) ||
    (side === 'left' && square.index === 24);

  const territoryBorderColor = territory
    ? getColorCSS(territory.ownerTeamColor)
    : undefined;

  // Extract short name (Korean part before parentheses)
  const shortName = square.name.split('(')[0].trim();

  return (
    <div
      onClick={onClick}
      className="relative bg-white border-2 border-black cursor-pointer hover:bg-yellow-50 transition-colors flex flex-col items-center justify-center overflow-hidden"
      style={{
        borderColor: territoryBorderColor || 'black',
        borderWidth: territory ? '3px' : '2px',
        minWidth: isCorner ? '72px' : side === 'top' || side === 'bottom' ? '64px' : '72px',
        minHeight: isCorner ? '72px' : side === 'left' || side === 'right' ? '52px' : '72px',
      }}
      title={square.description || square.name}
    >
      {/* Multiplier badge */}
      {multiplier > 1 && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-1 leading-tight z-10">
          x{multiplier}
        </div>
      )}

      {/* Square index */}
      <div className="text-[8px] text-gray-400 font-bold leading-none">{square.index}</div>

      {/* Square name */}
      <div className="text-[9px] font-black text-center leading-tight px-0.5 truncate w-full">
        {shortName}
      </div>

      {/* Territory owner indicator */}
      {territory && (
        <div
          className="text-[7px] font-bold leading-none truncate w-full text-center"
          style={{ color: getColorCSS(territory.ownerTeamColor) }}
        >
          {territory.ownerTeamName}
        </div>
      )}

      {/* Team pieces */}
      {teamsOnSquare.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
          {teamsOnSquare.map((team) => (
            <div
              key={team.id}
              className="w-3 h-3 rounded-full border border-black shadow-sm"
              style={{ backgroundColor: getColorCSS(team.color) }}
              title={team.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// GameBoard Component
// ============================================================

const GameBoard: React.FC<GameBoardProps> = ({
  teams,
  onSquareClick,
  gameMode,
  customBoardImage,
  customCards,
  territories,
  singlePieceMode,
}) => {
  // Build a map of square index -> teams at that position
  const teamsAtPosition: Record<number, Team[]> = {};
  teams.forEach((team) => {
    if (!teamsAtPosition[team.position]) {
      teamsAtPosition[team.position] = [];
    }
    teamsAtPosition[team.position].push(team);
  });

  // Build square arrays for each side
  const bottomSquares = BOARD_SQUARES.filter((s) => s.index >= 0 && s.index <= 8);
  const rightSquares = BOARD_SQUARES.filter((s) => s.index >= 9 && s.index <= 15);
  const topSquares = BOARD_SQUARES.filter((s) => s.index >= 16 && s.index <= 23).reverse(); // right to left
  const leftSquares = BOARD_SQUARES.filter((s) => s.index >= 24 && s.index <= 31);

  const renderSquare = (square: BoardSquare, side: 'bottom' | 'right' | 'top' | 'left') => (
    <Square
      key={square.index}
      square={square}
      teamsOnSquare={teamsAtPosition[square.index] || []}
      territory={territories[String(square.index)]}
      multiplier={getSquareMultiplier(square.index)}
      onClick={() => onSquareClick(square)}
      side={side}
    />
  );

  return (
    <div className="relative w-full max-w-[820px]">
      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-black tracking-tight">
          {gameMode}
        </h2>
        {singlePieceMode && (
          <span className="text-xs font-bold text-purple-600 border border-purple-400 px-2 py-0.5 rounded">
            공통 말 모드
          </span>
        )}
      </div>

      {/* Board container */}
      <div
        className="relative border-4 border-black bg-emerald-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        style={{
          backgroundImage: customBoardImage ? `url(${customBoardImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Top row (right to left, displayed left to right via reverse) */}
        <div className="flex justify-between">
          {/* Top-left corner (square 23 area) */}
          {topSquares.map((s) => renderSquare(s, 'top'))}
        </div>

        {/* Middle section: left column + center + right column */}
        <div className="flex">
          {/* Left column (top to bottom) */}
          <div className="flex flex-col">
            {leftSquares.map((s) => renderSquare(s, 'left'))}
          </div>

          {/* Center area */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-[280px]">
            {!customBoardImage && (
              <div className="text-center opacity-30">
                <div className="text-4xl font-black tracking-tighter">BLUE MARBLE</div>
                <div className="text-sm font-bold mt-1">Leadership Board Game</div>
              </div>
            )}
          </div>

          {/* Right column (bottom to top) */}
          <div className="flex flex-col-reverse">
            {rightSquares.map((s) => renderSquare(s, 'right'))}
          </div>
        </div>

        {/* Bottom row (left to right) */}
        <div className="flex justify-between">
          {bottomSquares.map((s) => renderSquare(s, 'bottom'))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
