import React from 'react';
import { Team, TeamColor } from '../types';

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

interface TeamStatusProps {
  team: Team;
  active: boolean;
  rank: number;
  totalTeams: number;
}

// ============================================================
// Component
// ============================================================

const TeamStatus: React.FC<TeamStatusProps> = ({ team, active, rank, totalTeams }) => {
  const rankBadge = rank === 1 ? '\uD83E\uDD47' : rank === 2 ? '\uD83E\uDD48' : rank === 3 ? '\uD83E\uDD49' : `#${rank}`;

  return (
    <div
      className={`w-full bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
        active ? 'ring-4 ring-yellow-400 scale-[1.02]' : ''
      }`}
    >
      {/* Header: color dot + name + rank */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-black flex-shrink-0"
            style={{ backgroundColor: getColorCSS(team.color) }}
          />
          <span className="font-black text-sm truncate">{team.name}</span>
        </div>
        <span className="text-sm font-bold">{rankBadge}</span>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-black leading-none">{team.score}</span>
        <span className="text-[10px] text-gray-500 font-bold">점</span>
      </div>

      {/* Active indicator */}
      {active && (
        <div className="bg-yellow-300 border-2 border-black text-[10px] font-black text-center py-0.5 mb-1">
          현재 턴
        </div>
      )}

      {/* Members */}
      {team.members && team.members.length > 0 && (
        <div className="text-[10px] text-gray-500 leading-tight truncate">
          {team.members.map((m) => m.name).join(', ')}
        </div>
      )}

      {/* Position & Lap */}
      <div className="flex items-center justify-between mt-1 text-[9px] text-gray-400 font-bold">
        <span>위치: {team.position}</span>
        <span>바퀴: {team.lapCount}</span>
      </div>
    </div>
  );
};

export default TeamStatus;
