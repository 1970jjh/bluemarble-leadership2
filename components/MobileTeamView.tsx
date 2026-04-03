import React from 'react';
import { Team, GamePhase, GameCard, Choice } from '../types';

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

interface MobileTeamViewProps {
  team: Team;
  activeTeamName: string;
  isMyTurn: boolean;
  gamePhase: GamePhase;
  onLogout?: () => void;
  activeCard: GameCard | null;
  activeInput: { choice: Choice | null; reasoning: string };
  onInputChange: (choice: Choice | null, reason: string) => void;
  onSubmit: () => void;
  isTeamSaved: boolean;
  isSaving: boolean;
  isGameStarted: boolean;
  isAiProcessing: boolean;
  teamNumber: number;
  onShowRules: () => void;
  allTeams: Team[];
}

const MobileTeamView: React.FC<MobileTeamViewProps> = ({
  team,
  activeTeamName,
  isMyTurn,
  gamePhase,
  onLogout,
  activeCard,
  activeInput,
  onInputChange,
  onSubmit,
  isTeamSaved,
  isSaving,
  isGameStarted,
  isAiProcessing,
  teamNumber,
  onShowRules,
  allTeams,
}) => {
  const colorClass = teamColorMap[team.color] || 'bg-gray-400';
  const sortedTeams = [...allTeams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      {/* Header */}
      <div
        className={`${colorClass} border-b-4 border-black p-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <span className="font-black text-lg">
            {team.name}
          </span>
          <span className="text-sm font-black opacity-70">#{teamNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowRules}
            className="bg-white text-black font-black text-xs py-1 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            규칙
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-white text-black font-black text-xs py-1 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              나가기
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Waiting state */}
        {!isGameStarted && (
          <div className="border-4 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="animate-pulse">
              <p className="font-black text-xl">게임 시작 대기 중...</p>
              <p className="font-black text-sm text-gray-500 mt-2">
                관리자가 게임을 시작할 때까지 기다려주세요
              </p>
            </div>
          </div>
        )}

        {/* Score Display */}
        <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
          <p className="font-black text-sm text-gray-500">현재 점수</p>
          <p className="font-black text-5xl mt-1">{team.score}</p>
        </div>

        {/* Active Card & Input */}
        {isGameStarted && activeCard && isMyTurn && (
          <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b-4 border-black pb-3">
              <h3 className="font-black text-lg">{activeCard.title}</h3>
              {activeCard.competency && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 border-2 border-black text-xs font-black">
                  {activeCard.competency}
                </span>
              )}
            </div>

            <p className="font-black text-sm leading-relaxed whitespace-pre-wrap">
              {activeCard.situation}
            </p>

            {/* Choice Buttons or Open-ended */}
            {activeCard.choices && activeCard.choices.length > 0 ? (
              <div className="space-y-2">
                <p className="font-black text-xs text-gray-500">선택지</p>
                {activeCard.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => onInputChange(choice, activeInput.reasoning)}
                    disabled={isTeamSaved}
                    className={`w-full text-left p-3 border-4 border-black font-black text-sm transition-all ${
                      activeInput.choice?.id === choice.id
                        ? 'bg-blue-400 text-white shadow-none translate-x-1 translate-y-1'
                        : 'bg-white hover:bg-blue-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <p className="font-black text-xs text-gray-500 mb-1">
                  자유 응답
                </p>
                <textarea
                  value={activeInput.choice?.text || ''}
                  onChange={(e) =>
                    onInputChange(
                      { id: 'open', text: e.target.value },
                      activeInput.reasoning
                    )
                  }
                  disabled={isTeamSaved}
                  placeholder="여기에 답변을 입력하세요..."
                  rows={3}
                  className="w-full border-4 border-black p-3 font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>
            )}

            {/* Reasoning */}
            <div>
              <p className="font-black text-xs text-gray-500 mb-1">
                이유 / 근거
              </p>
              <textarea
                value={activeInput.reasoning}
                onChange={(e) =>
                  onInputChange(activeInput.choice, e.target.value)
                }
                disabled={isTeamSaved}
                placeholder="선택한 이유를 설명해주세요..."
                rows={3}
                className="w-full border-4 border-black p-3 font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Submit */}
            {isTeamSaved ? (
              <div className="bg-green-400 border-4 border-black p-3 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-lg">제출 완료!</p>
              </div>
            ) : (
              <button
                onClick={onSubmit}
                disabled={
                  isSaving ||
                  isAiProcessing ||
                  (!activeInput.choice && !activeInput.reasoning)
                }
                className="w-full bg-black text-white font-black text-lg py-3 px-6 border-4 border-black hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving || isAiProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {isAiProcessing ? 'AI 분석 중...' : '제출 중...'}
                  </span>
                ) : (
                  '제출하기'
                )}
              </button>
            )}
          </div>
        )}

        {/* Turn Info */}
        {isGameStarted && !isMyTurn && (
          <div className="border-4 border-black bg-gray-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="font-black text-sm text-gray-600">
              현재 차례: <span className="text-black">{activeTeamName}</span>
            </p>
          </div>
        )}

        {/* Leaderboard */}
        {isGameStarted && (
          <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-sm mb-3 border-b-4 border-black pb-2">
              순위표
            </h3>
            <div className="space-y-2">
              {sortedTeams.map((t, i) => {
                const tColor = teamColorMap[t.color] || 'bg-gray-200';
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-2 border-2 border-black ${
                      t.id === team.id ? tColor : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm w-6">{i + 1}.</span>
                      <span className="font-black text-sm truncate">
                        {t.name}
                      </span>
                    </div>
                    <span className="font-black text-sm">{t.score}점</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTeamView;
