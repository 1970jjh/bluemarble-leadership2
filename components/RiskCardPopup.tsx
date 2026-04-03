import React, { useEffect, useRef } from 'react';
import { Team } from '../types';

interface RiskCardPopupProps {
  visible: boolean;
  teamName: string;
  chanceCardNumber: number;
  teams: Team[];
  currentTeamId: string;
  onSelectTeam: (targetTeamId: string) => void;
  onSkip: () => void;
  duration: number;
}

export default function RiskCardPopup({
  visible,
  teamName,
  chanceCardNumber,
  teams,
  currentTeamId,
  onSelectTeam,
  onSkip,
  duration,
}: RiskCardPopupProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    timerRef.current = setTimeout(() => {
      onSkip();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration]);

  if (!visible) return null;

  const otherTeams = teams.filter((t) => t.id !== currentTeamId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black p-8 max-w-md w-full mx-4 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Warning icon */}
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-3xl font-black text-black mb-2">
          리스크 카드!
        </h2>

        {/* Team and card info */}
        <div className="bg-red-400 border-4 border-black px-4 py-3 mb-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xl font-black text-white">{teamName}</p>
        </div>
        <p className="text-sm font-black text-gray-600 mb-4">
          찬스카드 #{chanceCardNumber}
        </p>

        {/* Target team selection */}
        <p className="text-lg font-black text-black mb-3">
          대상 팀을 선택하세요
        </p>
        <div className="space-y-2 mb-4">
          {otherTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              className="w-full bg-orange-400 hover:bg-orange-500 text-black font-black text-base py-2 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all active:translate-x-1 active:translate-y-1"
            >
              {team.name}
            </button>
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="w-full bg-gray-300 hover:bg-gray-400 text-black font-black text-base py-2 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all active:translate-x-1 active:translate-y-1"
        >
          건너뛰기
        </button>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-200 border-2 border-black h-2 overflow-hidden">
          <div
            className="h-full bg-red-500"
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
