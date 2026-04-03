import React, { useState } from 'react';
import {
  GameCard,
  Team,
  TeamResponse,
  AIComparativeResult,
  Choice,
} from '../types';

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

interface SimultaneousResponseViewProps {
  card: GameCard | null;
  team: Team;
  myResponse: TeamResponse | undefined;
  isRevealed: boolean;
  allResponses: { [teamId: string]: TeamResponse };
  allTeams: Team[];
  aiResult: AIComparativeResult | null;
  onSubmit: (choice: Choice | null, reasoning: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

const SimultaneousResponseView: React.FC<SimultaneousResponseViewProps> = ({
  card,
  team,
  myResponse,
  isRevealed,
  allResponses,
  allTeams,
  aiResult,
  onSubmit,
  onClose,
  onLogout,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [reasoning, setReasoning] = useState('');

  const hasSubmitted = myResponse?.isSubmitted ?? false;
  const colorClass = teamColorMap[team.color] || 'bg-gray-400';

  const handleSubmit = () => {
    onSubmit(selectedChoice, reasoning);
  };

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 bg-yellow-50 overflow-y-auto">
      {/* Header */}
      <div
        className={`${colorClass} border-b-4 border-black p-4 flex items-center justify-between sticky top-0 z-10`}
      >
        <span className="font-black text-lg">{team.name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="bg-white text-black font-black text-xs py-1 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            닫기
          </button>
          <button
            onClick={onLogout}
            className="bg-white text-black font-black text-xs py-1 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            나가기
          </button>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Card Info */}
        <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-black text-xl border-b-4 border-black pb-2 mb-3">
            {card.title}
          </h2>
          {card.competency && (
            <span className="inline-block mb-3 px-2 py-0.5 bg-blue-100 border-2 border-black text-xs font-black">
              {card.competency}
            </span>
          )}
          <p className="font-black text-sm leading-relaxed whitespace-pre-wrap">
            {card.situation}
          </p>
        </div>

        {/* Input Section - Not yet submitted */}
        {!hasSubmitted && (
          <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-black text-lg border-b-4 border-black pb-2">
              응답 입력
            </h3>

            {/* Choice Buttons or Open-ended */}
            {card.choices && card.choices.length > 0 ? (
              <div className="space-y-2">
                <p className="font-black text-xs text-gray-500">선택지</p>
                {card.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => setSelectedChoice(choice)}
                    className={`w-full text-left p-3 border-4 border-black font-black text-sm transition-all ${
                      selectedChoice?.id === choice.id
                        ? 'bg-blue-400 text-white shadow-none translate-x-1 translate-y-1'
                        : 'bg-white hover:bg-blue-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    }`}
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
                  value={selectedChoice?.text || ''}
                  onChange={(e) =>
                    setSelectedChoice({ id: 'open', text: e.target.value })
                  }
                  placeholder="여기에 답변을 입력하세요..."
                  rows={3}
                  className="w-full border-4 border-black p-3 font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            {/* Reasoning */}
            <div>
              <p className="font-black text-xs text-gray-500 mb-1">
                이유 / 근거
              </p>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="선택한 이유를 설명해주세요..."
                rows={3}
                className="w-full border-4 border-black p-3 font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selectedChoice && !reasoning}
              className="w-full bg-black text-white font-black text-lg py-3 px-6 border-4 border-black hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              제출하기
            </button>
          </div>
        )}

        {/* Submitted but not revealed */}
        {hasSubmitted && !isRevealed && (
          <div className="border-4 border-black bg-green-100 p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="animate-pulse">
              <p className="font-black text-xl">제출 완료!</p>
              <p className="font-black text-sm text-gray-600 mt-2">
                다른 팀의 응답을 기다리는 중...
              </p>
            </div>
          </div>
        )}

        {/* Revealed - Show all responses */}
        {isRevealed && (
          <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-black text-lg border-b-4 border-black pb-2">
              전체 응답 공개
            </h3>
            <div className="space-y-3">
              {allTeams.map((t) => {
                const response = allResponses[t.id];
                const tColor = teamColorMap[t.color] || 'bg-gray-200';
                return (
                  <div
                    key={t.id}
                    className="border-4 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-block w-4 h-4 border-2 border-black ${tColor}`}
                      />
                      <span className="font-black text-sm">{t.name}</span>
                    </div>
                    {response ? (
                      <div className="space-y-1">
                        {response.selectedChoice && (
                          <p className="font-black text-sm bg-blue-50 border-2 border-black p-2">
                            {response.selectedChoice.text}
                          </p>
                        )}
                        {response.reasoning && (
                          <p className="font-black text-xs text-gray-600">
                            {response.reasoning}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-black text-xs text-gray-400">
                        미응답
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Result Rankings */}
        {aiResult && (
          <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-black text-lg border-b-4 border-black pb-2">
              AI 분석 결과
            </h3>

            {/* Rankings */}
            <div className="space-y-3">
              {aiResult.rankings
                .sort((a, b) => a.rank - b.rank)
                .map((ranking) => {
                  const rankTeam = allTeams.find((t) => t.id === ranking.teamId);
                  const tColor = rankTeam
                    ? teamColorMap[rankTeam.color] || 'bg-gray-200'
                    : 'bg-gray-200';
                  return (
                    <div
                      key={ranking.teamId}
                      className={`border-4 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                        ranking.teamId === team.id ? 'bg-yellow-100' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-2xl">
                            {ranking.rank}위
                          </span>
                          <span
                            className={`inline-block w-4 h-4 border-2 border-black ${tColor}`}
                          />
                          <span className="font-black text-sm">
                            {ranking.teamName}
                          </span>
                        </div>
                        <span className="font-black text-lg bg-black text-white px-3 py-1">
                          +{ranking.score}점
                        </span>
                      </div>
                      <p className="font-black text-xs text-gray-600 leading-relaxed">
                        {ranking.feedback}
                      </p>
                    </div>
                  );
                })}
            </div>

            {/* Guidance */}
            {aiResult.guidance && (
              <div className="border-4 border-black bg-blue-50 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-xs text-gray-500 mb-1">
                  가이드
                </p>
                <p className="font-black text-sm leading-relaxed">
                  {aiResult.guidance}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimultaneousResponseView;
