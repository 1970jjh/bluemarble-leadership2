import React from 'react';
import { Team, TurnRecord } from '../types';

interface ReportViewProps {
  teams: Team[];
  onClose: () => void;
  reportGenerationGuidelines?: string;
}

const teamColorMap: Record<string, string> = {
  Red: 'bg-red-400',
  Blue: 'bg-blue-400',
  Green: 'bg-green-400',
  Yellow: 'bg-yellow-400',
  Purple: 'bg-purple-400',
  Orange: 'bg-orange-400',
  Pink: 'bg-pink-400',
  Teal: 'bg-teal-400',
  Cyan: 'bg-cyan-400',
  Lime: 'bg-lime-400',
  Indigo: 'bg-indigo-400',
  Amber: 'bg-amber-400',
  Emerald: 'bg-emerald-400',
  Slate: 'bg-slate-400',
  Rose: 'bg-rose-400',
};

const ReportView: React.FC<ReportViewProps> = ({
  teams,
  onClose,
  reportGenerationGuidelines,
}) => {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-yellow-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b-4 border-black p-4 flex items-center justify-between sticky top-0 z-10 print:static">
        <h1 className="font-black text-2xl">게임 리포트</h1>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white font-black text-sm py-2 px-4 border-4 border-black hover:bg-blue-600 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            인쇄
          </button>
          <button
            onClick={onClose}
            className="bg-white text-black font-black text-sm py-2 px-4 border-4 border-black hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            닫기
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Final Rankings */}
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-black text-xl mb-4 border-b-4 border-black pb-2">
            최종 순위
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="font-black text-left p-2 text-sm">순위</th>
                <th className="font-black text-left p-2 text-sm">팀</th>
                <th className="font-black text-right p-2 text-sm">점수</th>
                <th className="font-black text-right p-2 text-sm">턴 수</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, index) => {
                const colorClass = teamColorMap[team.color] || 'bg-gray-200';
                return (
                  <tr
                    key={team.id}
                    className={`border-b-2 border-black ${
                      index === 0 ? 'bg-yellow-100' : ''
                    }`}
                  >
                    <td className="font-black p-2 text-lg">{index + 1}</td>
                    <td className="font-black p-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-4 h-4 border-2 border-black ${colorClass}`}
                        />
                        <span>{team.name}</span>
                      </div>
                    </td>
                    <td className="font-black p-2 text-right text-lg">
                      {team.score}
                    </td>
                    <td className="font-black p-2 text-right text-sm text-gray-600">
                      {team.history.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Per-team Detail */}
        {sortedTeams.map((team, teamIndex) => {
          const colorClass = teamColorMap[team.color] || 'bg-gray-200';
          return (
            <div
              key={team.id}
              className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Team Header */}
              <div
                className={`${colorClass} border-b-4 border-black p-4 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg">
                    {teamIndex + 1}위 - {team.name}
                  </span>
                </div>
                <span className="font-black text-xl bg-white border-4 border-black px-3 py-1">
                  {team.score}점
                </span>
              </div>

              {/* Turn History */}
              <div className="p-4 space-y-4">
                {team.history.length === 0 ? (
                  <p className="font-black text-sm text-gray-400 text-center py-4">
                    기록된 턴이 없습니다.
                  </p>
                ) : (
                  team.history.map((record: TurnRecord, turnIdx: number) => (
                    <div
                      key={`${team.id}-turn-${turnIdx}`}
                      className="border-4 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2"
                    >
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <span className="font-black text-sm">
                          턴 {record.turnNumber}
                        </span>
                        <span className="font-black text-xs bg-blue-100 border-2 border-black px-2 py-0.5">
                          {record.cardTitle}
                        </span>
                      </div>

                      {/* Situation */}
                      <div>
                        <p className="font-black text-xs text-gray-500 mb-1">
                          상황
                        </p>
                        <p className="font-black text-sm leading-relaxed whitespace-pre-wrap">
                          {record.situation}
                        </p>
                      </div>

                      {/* Decision */}
                      <div>
                        <p className="font-black text-xs text-gray-500 mb-1">
                          선택
                        </p>
                        <p className="font-black text-sm bg-blue-50 border-2 border-black p-2">
                          {record.choiceText}
                        </p>
                      </div>

                      {/* Reasoning */}
                      {record.reasoning && (
                        <div>
                          <p className="font-black text-xs text-gray-500 mb-1">
                            이유
                          </p>
                          <p className="font-black text-xs text-gray-700">
                            {record.reasoning}
                          </p>
                        </div>
                      )}

                      {/* AI Feedback */}
                      {record.aiFeedback && (
                        <div className="bg-yellow-50 border-2 border-black p-3">
                          <p className="font-black text-xs text-gray-500 mb-1">
                            AI 피드백
                          </p>
                          <p className="font-black text-xs leading-relaxed">
                            {record.aiFeedback}
                          </p>
                        </div>
                      )}

                      {/* Score Changes */}
                      {record.scoreChanges && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(record.scoreChanges).map(
                            ([key, value]) =>
                              value !== 0 && (
                                <span
                                  key={key}
                                  className={`font-black text-xs px-2 py-0.5 border-2 border-black ${
                                    (value as number) > 0
                                      ? 'bg-green-200'
                                      : 'bg-red-200'
                                  }`}
                                >
                                  {key}: {(value as number) > 0 ? '+' : ''}
                                  {value as number}
                                </span>
                              )
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportView;
