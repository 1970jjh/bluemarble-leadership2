import React, { useState, useEffect } from 'react';
import { GameCard, Choice, Team, TeamColor } from '../types';
import { TeamResponseData, TeamRankingData, AIComparativeResultData } from '../lib/firestore';
import { X, Send, Eye, Sparkles, Check, Clock, Loader2, Trophy, Medal, Award } from 'lucide-react';

interface SimultaneousResponseModalProps {
  card: GameCard;
  visible: boolean;
  teams: Team[];
  teamResponses: { [teamId: string]: TeamResponseData };
  isRevealed: boolean;
  aiResult: AIComparativeResultData | null;
  isAnalyzing: boolean;

  // 현재 사용자 정보
  isAdmin: boolean;
  currentTeamId?: string;  // 참가자인 경우 자신의 팀 ID
  currentTeamName?: string;

  // 콜백
  onSubmitResponse: (teamId: string, selectedChoice: Choice | null, reasoning: string) => void;
  onRevealResponses: () => void;
  onRunAIAnalysis: () => void;
  onClose: () => void;
  onApplyScores: (rankings: TeamRankingData[]) => void;
}

// 랭킹에 따른 배점 계산 함수
const calculateScore = (rank: number, totalTeams: number): number => {
  // 점수 = 100 - ((순위 - 1) × 간격)
  // 간격은 팀 수에 따라 다름:
  // 2-4팀: 간격 = (100 - 50) / (팀수 - 1) => 꼴등 50점
  // 5-6팀: 간격 = (100 - 40) / (팀수 - 1) => 꼴등 40점
  // 7-9팀: 간격 = (100 - 20) / (팀수 - 1) => 꼴등 20점
  // 10-12팀: 간격 = (100 - 10) / (팀수 - 1) => 꼴등 10점

  let lastPlaceScore: number;
  if (totalTeams <= 4) {
    lastPlaceScore = 50;
  } else if (totalTeams <= 6) {
    lastPlaceScore = 40;
  } else if (totalTeams <= 9) {
    lastPlaceScore = 20;
  } else {
    lastPlaceScore = 10;
  }

  const interval = (100 - lastPlaceScore) / (totalTeams - 1);
  return Math.round(100 - (rank - 1) * interval);
};

// 랭킹 아이콘 컴포넌트
const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
  return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">{rank}</span>;
};

const SimultaneousResponseModal: React.FC<SimultaneousResponseModalProps> = ({
  card,
  visible,
  teams,
  teamResponses,
  isRevealed,
  aiResult,
  isAnalyzing,
  isAdmin,
  currentTeamId,
  currentTeamName,
  onSubmitResponse,
  onRevealResponses,
  onRunAIAnalysis,
  onClose,
  onApplyScores
}) => {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isOpenEnded = !card.choices || card.choices.length === 0;

  // 팀 응답 상태 확인
  useEffect(() => {
    if (currentTeamId && teamResponses[currentTeamId]?.isSubmitted) {
      setHasSubmitted(true);
      setSelectedChoice(teamResponses[currentTeamId].selectedChoice as Choice | null);
      setReasoning(teamResponses[currentTeamId].reasoning);
    }
  }, [currentTeamId, teamResponses]);

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (visible && !teamResponses[currentTeamId || '']?.isSubmitted) {
      setSelectedChoice(null);
      setReasoning('');
      setHasSubmitted(false);
    }
  }, [visible, currentTeamId]);

  if (!visible) return null;

  const handleSubmit = () => {
    if (!currentTeamId) return;
    if (!isOpenEnded && !selectedChoice) return;
    if (!reasoning.trim()) return;

    onSubmitResponse(currentTeamId, selectedChoice, reasoning);
    setHasSubmitted(true);
  };

  // 제출 완료된 팀 수
  const submittedCount = Object.values(teamResponses).filter(r => r.isSubmitted).length;
  const totalTeams = teams.length;

  // 타입 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CoreValue': return 'bg-indigo-900 text-white';
      case 'Custom': return 'bg-gray-800 text-white';
      default: return 'bg-blue-900 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl border-4 border-black shadow-hard max-h-[95vh] overflow-hidden flex flex-col">

        {/* 닫기 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-6 -right-6 bg-red-600 text-white border-4 border-black p-2 shadow-hard hover:bg-red-500 hover:scale-110 transition-transform z-50"
          >
            <X size={24} strokeWidth={4} />
          </button>
        )}

        {/* 헤더 */}
        <div className={`p-4 ${getTypeColor(card.type)} border-b-4 border-black flex justify-between items-center shrink-0`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="inline-block bg-black text-white px-2 py-1 text-xs font-bold uppercase">
                {card.type}
              </div>
              <div className="inline-block bg-yellow-400 text-black px-2 py-1 text-xs font-bold uppercase">
                전체 팀 동시 응답
              </div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">{card.title}</h2>
          </div>
          <div className="bg-white text-black border-2 border-black px-3 py-2 text-center">
            <div className="text-xs font-bold uppercase">응답 현황</div>
            <div className="text-xl font-black">{submittedCount} / {totalTeams}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* 상황 설명 */}
          <div className="mb-6 border-l-8 border-gray-300 pl-4">
            <h3 className="text-black text-sm font-bold uppercase mb-1 tracking-widest">Situation</h3>
            <p className="text-xl font-bold text-gray-900 leading-snug">
              "{card.situation}"
            </p>
          </div>

          {/* AI 분석 결과가 있는 경우 */}
          {aiResult && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-4 border-purple-600 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-black text-purple-800">AI 비교 분석 결과</h3>
              </div>

              {/* 랭킹 표 */}
              <div className="space-y-2 mb-4">
                {aiResult.rankings.map((ranking) => (
                  <div
                    key={ranking.teamId}
                    className={`flex items-center gap-3 p-3 bg-white border-2 rounded-lg ${
                      ranking.rank === 1 ? 'border-yellow-400 shadow-md' :
                      ranking.rank === 2 ? 'border-gray-400' :
                      ranking.rank === 3 ? 'border-amber-600' :
                      'border-gray-200'
                    }`}
                  >
                    <RankIcon rank={ranking.rank} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{ranking.teamName}</span>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          선택: {ranking.selectedChoice?.id || '주관식'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{ranking.feedback}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-purple-700">{ranking.score}점</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 가이드 (이럴 땐, 이렇게...) */}
              <div className="bg-white border-2 border-purple-300 p-4 rounded-lg">
                <div className="text-sm font-bold text-purple-700 uppercase mb-2">💡 이럴 땐, 이렇게...</div>
                <p className="text-gray-800 font-medium">{aiResult.guidance}</p>
              </div>

              {/* 점수 적용 버튼 (관리자만) */}
              {isAdmin && (
                <button
                  onClick={() => onApplyScores(aiResult.rankings)}
                  className="w-full mt-4 py-3 bg-green-600 text-white font-black text-lg border-4 border-black hover:bg-green-500 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  점수 적용 및 다음 턴으로
                </button>
              )}
            </div>
          )}

          {/* 응답 공개 전 */}
          {!isRevealed && !aiResult && (
            <>
              {/* 팀 응답 상태 (관리자 뷰) */}
              {isAdmin && (
                <div className="mb-6 bg-gray-50 border-2 border-gray-300 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock size={16} />
                    팀별 응답 현황
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {teams.map((team) => {
                      const response = teamResponses[team.id];
                      const isSubmitted = response?.isSubmitted;
                      return (
                        <div
                          key={team.id}
                          className={`flex items-center gap-2 p-2 rounded border-2 ${
                            isSubmitted
                              ? 'bg-green-100 border-green-500 text-green-800'
                              : 'bg-gray-100 border-gray-300 text-gray-600'
                          }`}
                        >
                          {isSubmitted ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Clock size={16} className="text-gray-400 animate-pulse" />
                          )}
                          <span className="font-medium text-sm">{team.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 참가자 응답 UI */}
              {!isAdmin && currentTeamId && (
                <div className="space-y-4">
                  {hasSubmitted ? (
                    <div className="bg-green-100 border-4 border-green-600 p-6 text-center">
                      <Check className="w-12 h-12 mx-auto text-green-600 mb-2" />
                      <h4 className="text-xl font-black text-green-800 mb-1">응답 완료!</h4>
                      <p className="text-green-700">다른 팀의 응답을 기다리는 중입니다...</p>
                      <div className="mt-4 text-sm text-green-600">
                        {submittedCount} / {totalTeams} 팀 응답 완료
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 선택지 */}
                      {!isOpenEnded && card.choices && (
                        <div>
                          <h3 className="text-black text-sm font-bold uppercase tracking-widest mb-2">
                            1. 선택하세요
                          </h3>
                          <div className="grid md:grid-cols-3 gap-3">
                            {card.choices.map((choice) => (
                              <button
                                key={choice.id}
                                onClick={() => setSelectedChoice(choice)}
                                className={`p-3 border-4 text-left transition-all ${
                                  selectedChoice?.id === choice.id
                                    ? 'border-blue-600 bg-blue-50 shadow-md'
                                    : 'border-black hover:bg-gray-50'
                                }`}
                              >
                                <span className={`inline-block px-2 py-0.5 text-sm font-bold mr-2 ${
                                  selectedChoice?.id === choice.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-black text-white'
                                }`}>
                                  {choice.id}
                                </span>
                                <span className="font-medium">{choice.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 이유 입력 */}
                      <div className={!isOpenEnded && !selectedChoice ? 'opacity-50 pointer-events-none' : ''}>
                        <h3 className="text-black text-sm font-bold uppercase tracking-widest mb-2">
                          {isOpenEnded ? '1. 답변을 작성하세요' : '2. 선택 이유를 작성하세요'}
                        </h3>
                        <textarea
                          value={reasoning}
                          onChange={(e) => setReasoning(e.target.value)}
                          placeholder={isOpenEnded ? '답변을 입력하세요...' : '선택 이유를 입력하세요...'}
                          className="w-full h-28 p-3 border-4 border-black font-medium focus:outline-none focus:bg-yellow-50 resize-none"
                        />
                      </div>

                      {/* 제출 버튼 */}
                      <button
                        onClick={handleSubmit}
                        disabled={(!isOpenEnded && !selectedChoice) || !reasoning.trim()}
                        className="w-full py-4 bg-blue-900 text-white text-xl font-black uppercase border-4 border-black hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        <Send size={20} />
                        응답 제출
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 관리자 컨트롤 버튼 */}
              {isAdmin && (
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={onRevealResponses}
                    disabled={submittedCount === 0}
                    className={`flex-1 py-4 text-xl font-black uppercase border-4 border-black flex items-center justify-center gap-3 ${
                      submittedCount > 0
                        ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Eye size={24} />
                    공개 ({submittedCount}개 응답)
                  </button>
                </div>
              )}
            </>
          )}

          {/* 응답 공개 후, AI 분석 전 */}
          {isRevealed && !aiResult && (
            <div className="space-y-4">
              <div className="bg-yellow-100 border-4 border-yellow-500 p-4 text-center">
                <Eye className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                <h4 className="text-lg font-black text-yellow-800">모든 응답이 공개되었습니다!</h4>
              </div>

              {/* 모든 팀 응답 표시 */}
              <div className="space-y-3">
                {teams.map((team) => {
                  const response = teamResponses[team.id];
                  if (!response?.isSubmitted) return null;

                  return (
                    <div
                      key={team.id}
                      className="bg-white border-2 border-gray-300 p-4 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg">{team.name}</span>
                        {response.selectedChoice && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 font-bold">
                            {response.selectedChoice.id}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">{response.reasoning}</p>
                    </div>
                  );
                })}
              </div>

              {/* AI 분석 버튼 (관리자만) */}
              {isAdmin && (
                <button
                  onClick={onRunAIAnalysis}
                  disabled={isAnalyzing}
                  className={`w-full py-4 text-xl font-black uppercase border-4 border-black flex items-center justify-center gap-3 ${
                    isAnalyzing
                      ? 'bg-purple-400 text-white cursor-wait'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      AI 분석 실행
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimultaneousResponseModal;
