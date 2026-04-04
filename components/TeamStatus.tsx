import React from 'react';
import { Team, TeamColor } from '../types';
import { Trophy } from 'lucide-react';

interface TeamStatusProps {
  team: Team;
  active: boolean;
  rank?: number;
  totalTeams?: number;
}

const TeamStatus: React.FC<TeamStatusProps> = ({ team, active, rank, totalTeams }) => {
  const getHeaderColor = (color: TeamColor) => {
    switch (color) {
      case TeamColor.Red: return 'bg-red-600 text-white';
      case TeamColor.Blue: return 'bg-blue-600 text-white';
      case TeamColor.Green: return 'bg-green-600 text-white';
      case TeamColor.Yellow: return 'bg-yellow-400 text-black';
      case TeamColor.Purple: return 'bg-purple-600 text-white';
      case TeamColor.Orange: return 'bg-orange-500 text-white';
      case TeamColor.Pink: return 'bg-pink-500 text-white';
      case TeamColor.Teal: return 'bg-teal-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  // 단일 점수 (기본값 100)
  const teamScore = team.score ?? 100;

  return (
    <div className={`border-2 border-black bg-white transition-all duration-300 ${active ? 'shadow-hard translate-x-[-1px] translate-y-[-1px] ring-2 ring-yellow-400' : 'opacity-90'}`}>
      <div className={`px-2 py-1 border-b-2 border-black ${getHeaderColor(team.color)}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-black text-lg uppercase truncate">{team.name}</h3>
          <div className="flex items-center gap-1">
            {team.isBurnout && <span className="bg-black text-white text-[8px] px-1 py-0.5 font-bold">BURN</span>}
            {active && <span className="text-xs animate-bounce">▼</span>}
          </div>
        </div>
        {/* 팀원 목록 표시 */}
        {team.members.length > 0 && (
          <div className="text-[10px] opacity-80 truncate">
            {team.members.map(m => m.name).join(', ')}
          </div>
        )}
      </div>

      {/* 점수 표시 - 컴팩트하게 */}
      <div className="px-2 py-1">
        <div className="flex items-center justify-between">
          {rank !== undefined && (
            <span className={`text-xl font-black ${
              rank === 1 ? 'text-yellow-600' :
              rank === 2 ? 'text-gray-500' :
              rank === 3 ? 'text-orange-600' :
              'text-gray-700'
            }`}>
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
            </span>
          )}
          <div className="text-right">
            <span className="text-xl font-black text-blue-800">{teamScore}점</span>
            {totalTeams !== undefined && (
              <span className="text-[10px] text-gray-500 ml-1">/{totalTeams}팀</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatus;
