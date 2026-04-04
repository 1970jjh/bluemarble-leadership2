import React, { useState, useRef, useEffect } from 'react';
import { GameCard, Choice, Team, TeamResponse, AIComparativeResult } from '../types';
import { Send, CheckCircle2, Clock, Trophy, Users, Eye, Loader2, X, LogOut } from 'lucide-react';

interface SimultaneousResponseViewProps {
  card: GameCard;
  team: Team;
  myResponse?: TeamResponse;
  isRevealed: boolean;
  allResponses: { [teamId: string]: TeamResponse };
  allTeams: Team[];
  aiResult: AIComparativeResult | null;
  onSubmit: (choice: Choice | null, reasoning: string) => void;
  onClose: () => void;
  onLogout?: () => void;  // 로그아웃 핸들러 추가
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
  onLogout
}) => {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(myResponse?.selectedChoice || null);
  const [reasoning, setReasoning] = useState(myResponse?.reasoning || '');
  const [isSubmitting, setIsSubmitting] = useState(false);  // 제출 중 상태
  const [localSubmitted, setLocalSubmitted] = useState(false);  // 로컬 제출 완료 상태
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOpenEnded = !card.choices || card.choices.length === 0;
  const isSubmitted = myResponse?.isSubmitted || localSubmitted;  // Firebase 또는 로컬 상태

  useEffect(() => {
    if (!isSubmitted && !aiResult) {
      textareaRef.current?.focus();
    }
  }, [isSubmitted, aiResult]);

  const handleSubmit = () => {
    if (isSubmitting || isSubmitted) return;  // 중복 제출 방지
    if (isOpenEnded && !reasoning.trim()) return;
    if (!isOpenEnded && (!selectedChoice || !reasoning.trim())) return;

    setIsSubmitting(true);
    onSubmit(selectedChoice, reasoning);

    // 즉시 로컬 상태 업데이트 (Firebase 응답 기다리지 않음)
    setTimeout(() => {
      setLocalSubmitted(true);
      setIsSubmitting(false);
    }, 100);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Self': return 'bg-blue-900 text-white';
      case 'Team': return 'bg-green-800 text-white';
      case 'Leader': return 'bg-red-800 text-white';
      default: return 'bg-yellow-400 text-black';
    }
  };

  // 내 팀 랭킹 찾기
  const myRanking = aiResult?.rankings.find(r => r.teamId === team.id);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in duration-200 relative flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`p-4 ${getTypeColor(card.type)} border-b-4 border-black relative`}>
          {/* 우측 상단 버튼들 */}
          <div className="absolute top-2 right-2 flex gap-2">
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="로그아웃"
              >
                <LogOut size={18} />
              </button>
            )}
            {aiResult && (
              <button
                onClick={onClose}
                className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg transition-colors"
                title="닫기"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="inline-block bg-black text-white px-2 py-1 text-xs font-bold uppercase mb-2">
            {card.type}
          </div>
          <h2 className="text-2xl font-black uppercase">{card.title}</h2>
          <div className="mt-2 bg-white/20 px-3 py-1 inline-block rounded">
            <span className="font-bold">{team.name}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* 상황 설명 */}
          <div className="mb-6 border-l-4 border-gray-300 pl-4">
            <p className="text-lg font-bold text-gray-900">"{card.situation}"</p>
          </div>

          {/* AI 결과 표시 */}
          {aiResult && (
            <div className="mb-6">
              {/* 헤더 */}
              <div className="flex items-center gap-3 mb-5">
                <Trophy size={28} className="text-yellow-600" />
                <span className="text-xl font-black text-yellow-800 uppercase">AI 비교 분석 결과</span>
              </div>

              {/* 팀별 선택/이유/평가 */}
              <div className="space-y-4 mb-5">
                {aiResult.rankings.sort((a, b) => a.rank - b.rank).map((ranking) => (
                  <div
                    key={ranking.teamId}
                    className={`p-4 rounded-lg border-4 ${
                      ranking.teamId === team.id ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                    } ${
                      ranking.rank === 1 ? 'bg-yellow-50 border-yellow-500' :
                      ranking.rank === 2 ? 'bg-gray-50 border-gray-400' :
                      ranking.rank === 3 ? 'bg-orange-50 border-orange-400' :
                      'bg-white border-gray-300'
                    }`}
                  >
                    {/* 팀 이름 및 순위/점수 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Trophy size={22} className={
                          ranking.rank === 1 ? 'text-yellow-600' :
                          ranking.rank === 2 ? 'text-gray-500' :
                          ranking.rank === 3 ? 'text-orange-500' : 'text-gray-400'
                        } />
                        <span className="text-xl font-black">#{ranking.rank}</span>
                        <span className={`text-lg font-bold ${ranking.teamId === team.id ? 'text-blue-800' : ''}`}>
                          {ranking.teamName}
                          {ranking.teamId === team.id && <span className="ml-2 text-blue-600">(우리 팀)</span>}
                        </span>
                      </div>
                      <span className={`text-lg font-black px-3 py-1 rounded ${
                        ranking.rank === 1 ? 'bg-yellow-500 text-white' :
                        ranking.rank === 2 ? 'bg-gray-400 text-white' :
                        ranking.rank === 3 ? 'bg-orange-400 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        +{ranking.score}점
                      </span>
                    </div>

                    {/* 선택 옵션 */}
                    {ranking.selectedChoice && (
                      <div className="mb-2 p-2 bg-white/60 rounded-lg">
                        <span className="text-sm font-bold text-gray-600">선택: </span>
                        <span className="text-base font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded">
                          {ranking.selectedChoice.id}. {ranking.selectedChoice.text}
                        </span>
                      </div>
                    )}

                    {/* 선택 이유 */}
                    {ranking.reasoning && (
                      <div className="mb-2 p-2 bg-white/60 rounded-lg">
                        <span className="text-sm font-bold text-gray-600">선택 이유: </span>
                        <p className="text-base text-gray-800 mt-1">{ranking.reasoning}</p>
                      </div>
                    )}

                    {/* AI 평가 */}
                    <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                      <span className="text-sm font-bold text-purple-700">🤖 AI 평가: </span>
                      <p className="text-base text-gray-800 mt-1 leading-relaxed">{ranking.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Best Practice */}
              <div className="bg-white p-4 rounded-xl border-4 border-yellow-400">
                <div className="text-base font-black text-yellow-700 uppercase mb-2">💡 Best Practice</div>
                <p className="text-lg text-gray-800 font-medium leading-relaxed">{aiResult.guidance}</p>
              </div>

              {/* 팀별 점수 현황 */}
              {allTeams && allTeams.length > 0 && (
                <div className="mt-5 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={22} className="text-blue-600" />
                    <span className="text-lg font-black text-blue-800 uppercase">점수 적용 후 현황</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allTeams
                      .map(t => {
                        const ranking = aiResult.rankings.find(r => r.teamId === t.id);
                        const currentScore = t.score ?? 100;
                        const addedScore = ranking?.score ?? 0;
                        const newScore = currentScore + addedScore;
                        return { ...t, currentScore, addedScore, newScore };
                      })
                      .sort((a, b) => b.newScore - a.newScore)
                      .map((t, index) => (
                        <div
                          key={t.id}
                          className={`p-3 rounded-lg border-2 text-center ${
                            t.id === team.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                          } ${
                            index === 0 ? 'bg-yellow-100 border-yellow-400' :
                            index === 1 ? 'bg-gray-100 border-gray-300' :
                            index === 2 ? 'bg-orange-100 border-orange-300' :
                            'bg-white border-gray-200'
                          }`}
                        >
                          <div className="text-sm font-bold text-gray-600">
                            {t.name}
                            {t.id === team.id && <span className="text-blue-600 ml-1">(우리)</span>}
                          </div>
                          <div className="text-2xl font-black text-blue-800">{t.newScore}점</div>
                          <div className="text-xs font-medium text-green-600">
                            ({t.currentScore} + {t.addedScore})
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 응답 공개됨 (AI 결과 없을 때) */}
          {isRevealed && !aiResult && (
            <div className="mb-6 bg-blue-50 border-4 border-blue-400 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={18} className="text-blue-600" />
                <span className="font-bold text-blue-800">모든 팀 응답 공개됨</span>
              </div>
              <p className="text-blue-700 text-sm">관리자가 AI 비교 분석을 실행할 때까지 기다려주세요...</p>
            </div>
          )}

          {/* 제출 완료 (공개 전) */}
          {isSubmitted && !isRevealed && !aiResult && (
            <div className="mb-6 bg-green-100 border-4 border-green-500 p-4 rounded-lg text-center">
              <CheckCircle2 size={48} className="text-green-600 mx-auto mb-2" />
              <div className="font-bold text-green-800 text-lg">응답이 제출되었습니다!</div>
              <p className="text-green-700 text-sm mt-2">다른 팀의 응답을 기다리는 중...</p>

              {/* 팀 응답 현황 */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {allTeams.map(t => {
                  const resp = allResponses[t.id];
                  const submitted = resp?.isSubmitted;
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                        submitted ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {submitted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {t.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 입력 폼 (제출 전) */}
          {!isSubmitted && !aiResult && (
            <>
              {/* 옵션 선택 */}
              {!isOpenEnded && card.choices && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">1. 선택</h3>
                  <div className="space-y-2">
                    {card.choices.map(choice => (
                      <button
                        key={choice.id}
                        onClick={() => setSelectedChoice(choice)}
                        className={`w-full p-4 text-left border-4 transition-all ${
                          selectedChoice?.id === choice.id
                            ? 'bg-blue-100 border-blue-600 shadow-md'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className={`inline-block px-3 py-1 text-sm font-bold mr-2 ${
                          selectedChoice?.id === choice.id ? 'bg-blue-600 text-white' : 'bg-gray-200'
                        }`}>
                          {choice.id}
                        </span>
                        <span className="font-medium">{choice.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 선택 이유 */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">
                  {isOpenEnded ? '답변 작성' : '2. 선택 이유'}
                </h3>
                <textarea
                  ref={textareaRef}
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder={isOpenEnded ? "자유롭게 답변을 작성하세요..." : "왜 이 선택을 했는지 설명해주세요..."}
                  className="w-full p-4 border-4 border-gray-300 focus:border-blue-500 focus:outline-none resize-none h-32 font-medium"
                />
              </div>

              {/* 제출 버튼 */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (isOpenEnded ? !reasoning.trim() : !selectedChoice || !reasoning.trim())}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xl font-black uppercase border-4 border-black flex items-center justify-center gap-3 transition-all shadow-hard"
              >
                {isSubmitting ? (
                  <><Loader2 size={24} className="animate-spin" /> 제출 중...</>
                ) : (
                  <><Send size={24} /> 응답 제출</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimultaneousResponseView;
