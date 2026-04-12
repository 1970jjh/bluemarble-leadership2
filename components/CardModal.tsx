import React, { useEffect, useRef, useState } from 'react';
import { Choice, GameCard, AIEvaluationResult, TeamResponse, AIComparativeResult } from '../types';
import { X, Send, Sparkles, MessageSquare, Eye, Trophy, Users, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';

interface CardModalProps {
  card: GameCard;
  visible: boolean;
  timeLeft: number;

  // Controlled State
  selectedChoice: Choice | null;
  reasoning: string;
  onSelectionChange: (c: Choice) => void;
  onReasoningChange: (s: string) => void;
  onSubmit: () => Promise<void>;

  result: AIEvaluationResult | null;
  isProcessing: boolean;
  onClose?: () => void;

  // 추가: 읽기 전용 모드 (다른 팀 턴 뷰어 모드)
  readOnly?: boolean;
  // 추가: 현재 팀 이름 표시
  teamName?: string;
  // 추가: 미리보기 모드 (게임에 반영 안됨)
  isPreviewMode?: boolean;

  // 관리자 뷰용 추가 props
  isAdminView?: boolean;        // 관리자 대시보드 뷰 여부
  isTeamSaved?: boolean;        // 팀이 입력을 저장했는지
  onAISubmit?: () => Promise<void>;  // 관리자가 AI 분석 실행

  // 관람자 투표 (옵션별 투표한 팀 이름 목록)
  spectatorVotes?: { [optionId: string]: string[] };
  // 관람자 개인 투표 (readOnly 모드에서 사용)
  spectatorVote?: Choice | null;
  onSpectatorVote?: (choice: Choice) => void;
  // 리스크 카드 (모든 점수 마이너스)
  isRiskCardMode?: boolean;
  // x2/x3 점수 배율
  scoreMultiplier?: number;

  // ============================================================
  // 동시 응답 시스템 props
  // ============================================================
  allTeamResponses?: { [teamId: string]: TeamResponse };  // 모든 팀 응답
  allTeams?: { id: string; name: string; score?: number }[];  // 모든 팀 목록 (점수 포함)
  isResponsesRevealed?: boolean;  // 응답 공개 여부
  aiComparativeResult?: AIComparativeResult | null;  // AI 비교 분석 결과
  isComparingTeams?: boolean;  // AI 비교 분석 중
  onRevealResponses?: () => void;  // 관리자: 응답 공개
  onCompareTeams?: () => void;  // 관리자: AI 비교 분석
  onApplyResults?: () => void;  // 관리자: 결과 적용
  onRefreshResponses?: () => void;  // 관리자: 응답 다시 불러오기
}

const CardModal: React.FC<CardModalProps> = ({
  card,
  visible,
  timeLeft,
  selectedChoice,
  reasoning,
  onSelectionChange,
  onReasoningChange,
  onSubmit,
  result,
  isProcessing,
  onClose,
  readOnly = false,
  teamName,
  isPreviewMode = false,
  isAdminView = false,
  isTeamSaved = false,
  onAISubmit,
  spectatorVotes = {},
  spectatorVote,
  onSpectatorVote,
  isRiskCardMode = false,
  scoreMultiplier = 1,
  // 동시 응답 시스템
  allTeamResponses = {},
  allTeams = [],
  isResponsesRevealed = false,
  aiComparativeResult = null,
  isComparingTeams = false,
  onRevealResponses,
  onCompareTeams,
  onApplyResults,
  onRefreshResponses
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isOpenEnded = !card.choices || card.choices.length === 0;

  useEffect(() => {
    if (visible && !result) {
      if (isOpenEnded) {
         textareaRef.current?.focus();
      } else if (selectedChoice) {
         textareaRef.current?.focus();
      }
    }
  }, [selectedChoice, visible, result, isOpenEnded]);

  if (!visible) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Self': return 'bg-blue-900 text-white';
      case 'Team': return 'bg-green-800 text-white';
      case 'Leader': return 'bg-red-800 text-white';
      case 'Follower': return 'bg-orange-700 text-white';
      case 'Challenge': return 'bg-purple-900 text-white';
      case 'CoreValue': return 'bg-indigo-900 text-white';
      default: return 'bg-yellow-400 text-black';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Allow submit if open ended OR if choice is selected
      if ((isOpenEnded || selectedChoice) && reasoning.trim() && !isProcessing) {
        onSubmit();
      }
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    return score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl border-4 border-black shadow-[16px_16px_0px_0px_rgba(255,255,255,0.2)] animate-in fade-in zoom-in duration-200 relative flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute -top-6 -right-6 bg-red-600 text-white border-4 border-black p-2 shadow-hard hover:bg-red-500 hover:scale-110 transition-transform z-50"
          >
            <X size={24} strokeWidth={4} />
          </button>
        )}

        {/* Header */}
        <div className={`p-6 ${getTypeColor(card.type)} border-b-4 border-black flex justify-between items-center shrink-0`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-block bg-black text-white px-2 py-1 text-xs font-bold uppercase">
                {card.type === 'CoreValue' ? 'CORE VALUE' : card.type}
              </div>
              {isPreviewMode && (
                <div className="inline-block bg-orange-500 text-white px-2 py-1 text-xs font-bold uppercase animate-pulse">
                  PREVIEW MODE
                </div>
              )}
              {isRiskCardMode && !isPreviewMode && (
                <div className="inline-block bg-red-600 text-white px-2 py-1 text-xs font-black uppercase animate-pulse border-2 border-red-900">
                  💀 RISK CARD -ALL
                </div>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
              {card.title}
              {scoreMultiplier > 1 && (
                <span className={`text-xl px-3 py-1 rounded-lg font-black animate-pulse ${
                  scoreMultiplier === 2 ? 'bg-yellow-400 text-yellow-900' : 'bg-red-500 text-white'
                }`}>
                  x{scoreMultiplier}
                </span>
              )}
            </h2>
          </div>
          {!result && timeLeft > 0 && (
            <div className="bg-white text-black border-4 border-black px-4 py-2 shadow-hard-sm">
               <span className="text-xl md:text-2xl font-mono font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Situation Section */}
          <div className="mb-8 border-l-8 border-gray-300 pl-6">
            <h3 className="text-black text-sm font-bold uppercase mb-2 tracking-widest">Situation</h3>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
              "{card.situation}"
            </p>
          </div>

          {!result ? (
            /* Input Phase */
            <div className="space-y-6">
              {/* 미리보기 모드 안내 */}
              {isPreviewMode && (
                <div className="bg-orange-100 border-4 border-orange-500 p-4 text-center">
                  <span className="font-bold text-orange-800">
                    🔍 미리보기 모드 - AI 평가 결과는 게임에 반영되지 않습니다
                  </span>
                </div>
              )}

              {/* 읽기 전용 모드 안내 */}
              {readOnly && !isPreviewMode && !isAdminView && (
                <div className="bg-yellow-100 border-4 border-yellow-500 p-4 text-center">
                  <span className="font-bold text-yellow-800">
                    {teamName ? `${teamName}의 턴입니다. 관람 모드로 시청 중...` : '다른 팀의 턴입니다.'}
                  </span>
                </div>
              )}

              {/* 관리자 뷰: 동시 응답 시스템 */}
              {isAdminView && (
                <>
                  {/* 팀 응답 현황 */}
                  <div className="bg-gray-50 border-4 border-gray-300 p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users size={20} className="text-gray-600" />
                        <span className="text-sm font-bold text-gray-700 uppercase">
                          팀 응답 현황 ({Object.values(allTeamResponses).filter(r => r.isSubmitted).length} / {allTeams.length})
                        </span>
                      </div>
                      {onRefreshResponses && (
                        <button
                          onClick={async () => {
                            setIsRefreshing(true);
                            await onRefreshResponses();
                            setTimeout(() => setIsRefreshing(false), 1500);
                          }}
                          disabled={isRefreshing}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded border-2 border-black hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                          {isRefreshing ? '확인 중...' : '응답 불러오기'}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {allTeams.map(team => {
                        const response = allTeamResponses[team.id];
                        const isSubmitted = response?.isSubmitted;
                        return (
                          <div
                            key={team.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border-2 ${
                              isSubmitted
                                ? 'bg-green-100 border-green-500'
                                : 'bg-yellow-50 border-yellow-400'
                            }`}
                          >
                            {isSubmitted ? (
                              <CheckCircle2 size={16} className="text-green-600" />
                            ) : (
                              <Clock size={16} className="text-yellow-600 animate-pulse" />
                            )}
                            <span className={`text-sm font-bold ${
                              isSubmitted ? 'text-green-800' : 'text-yellow-800'
                            }`}>
                              {team.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 공개 전 상태 */}
                  {!isResponsesRevealed && !aiComparativeResult && (
                    <>
                      {/* 옵션 표시 (선택 정보는 숨김) */}
                      {!isOpenEnded && card.choices && (
                        <div className="bg-gray-100 border-4 border-gray-300 p-4 mb-4">
                          <div className="text-xs font-bold text-gray-600 uppercase mb-3">선택 옵션</div>
                          <div className="space-y-2">
                            {card.choices.map((choice) => (
                              <div key={choice.id} className="p-3 bg-white rounded-lg border-2 border-gray-200">
                                <span className="px-3 py-1 text-sm font-bold bg-gray-300 text-gray-700 mr-2">
                                  {choice.id}
                                </span>
                                <span className="font-medium text-gray-700">{choice.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 공개 버튼 */}
                      {onRevealResponses && (
                        <button
                          onClick={onRevealResponses}
                          disabled={Object.values(allTeamResponses).filter(r => r.isSubmitted).length === 0}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xl font-black uppercase border-4 border-black flex items-center justify-center gap-3 transition-all shadow-hard mb-3"
                        >
                          <Eye size={24} /> 모든 팀 응답 공개
                        </button>
                      )}
                    </>
                  )}

                  {/* 공개 후 상태 - 모든 팀 응답 표시 */}
                  {isResponsesRevealed && !aiComparativeResult && (
                    <>
                      <div className="bg-blue-50 border-4 border-blue-400 p-4 mb-4">
                        <div className="text-sm font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
                          <Eye size={18} /> 모든 팀 응답 공개됨
                        </div>
                        <div className="space-y-4">
                          {allTeams.map(team => {
                            const response = allTeamResponses[team.id];
                            if (!response?.isSubmitted) return null;
                            return (
                              <div key={team.id} className="bg-white p-4 rounded-lg border-2 border-blue-300">
                                <div className="font-bold text-blue-800 mb-2">{team.name}</div>
                                {response.selectedChoice && (
                                  <div className="text-sm mb-1">
                                    <span className="font-bold text-gray-600">선택:</span>{' '}
                                    <span className="bg-blue-100 px-2 py-0.5 rounded">
                                      {response.selectedChoice.id}. {response.selectedChoice.text}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="font-bold text-gray-600">이유:</span>{' '}
                                  <span className="text-gray-800">{response.reasoning}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* AI 비교 분석 버튼 */}
                      {onCompareTeams && (
                        <button
                          onClick={onCompareTeams}
                          disabled={isComparingTeams}
                          className={`w-full py-4 text-white text-xl font-black uppercase border-4 border-black flex items-center justify-center gap-3 transition-all shadow-hard mb-3 ${
                            isComparingTeams ? 'bg-purple-500 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          {isComparingTeams ? (
                            <>
                              <Loader2 size={24} className="animate-spin" /> AI 비교 분석 중...
                            </>
                          ) : (
                            <>
                              <Sparkles size={24} /> AI 비교 분석 실행
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}

                  {/* AI 비교 분석 결과 */}
                  {aiComparativeResult && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-500 p-6 mb-4">
                      <div className="flex items-center gap-3 mb-6">
                        <Trophy size={32} className="text-yellow-600" />
                        <span className="text-2xl font-black text-yellow-800 uppercase">AI 비교 분석 결과</span>
                      </div>

                      {/* 팀별 선택/이유/평가 */}
                      <div className="space-y-5 mb-6">
                        {aiComparativeResult.rankings
                          .sort((a, b) => a.rank - b.rank)
                          .map((ranking) => (
                            <div
                              key={ranking.teamId}
                              className={`p-5 rounded-xl border-4 ${
                                ranking.rank === 1
                                  ? 'bg-yellow-100 border-yellow-500'
                                  : ranking.rank === 2
                                  ? 'bg-gray-100 border-gray-400'
                                  : ranking.rank === 3
                                  ? 'bg-orange-100 border-orange-400'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {/* 팀 이름 및 순위/점수 */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <span className={`text-4xl font-black ${
                                    ranking.rank === 1 ? 'text-yellow-600' :
                                    ranking.rank === 2 ? 'text-gray-500' :
                                    ranking.rank === 3 ? 'text-orange-500' : 'text-gray-400'
                                  }`}>
                                    #{ranking.rank}
                                  </span>
                                  <span className="font-black text-2xl">{ranking.teamName}</span>
                                </div>
                                <span className={`text-2xl font-black px-4 py-2 rounded-lg ${
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
                                <div className="mb-3 p-3 bg-white/60 rounded-lg">
                                  <span className="text-base font-bold text-gray-600">선택: </span>
                                  <span className="text-lg font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded">
                                    {ranking.selectedChoice.id}. {ranking.selectedChoice.text}
                                  </span>
                                </div>
                              )}

                              {/* 선택 이유 */}
                              {ranking.reasoning && (
                                <div className="mb-4 p-3 bg-white/60 rounded-lg">
                                  <span className="text-base font-bold text-gray-600">선택 이유: </span>
                                  <p className="text-lg text-gray-800 mt-1">{ranking.reasoning}</p>
                                </div>
                              )}

                              {/* AI 평가 */}
                              <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                                <span className="text-base font-bold text-purple-700">🤖 AI 평가: </span>
                                <p className="text-lg text-gray-800 mt-1 leading-relaxed">{ranking.feedback}</p>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Best Practice */}
                      <div className="bg-white p-5 rounded-xl border-4 border-yellow-400">
                        <div className="text-lg font-black text-yellow-700 uppercase mb-3">💡 Best Practice</div>
                        <p className="text-xl text-gray-800 font-medium leading-relaxed">{aiComparativeResult.guidance}</p>
                      </div>

                      {/* 팀별 점수 현황 */}
                      {allTeams && allTeams.length > 0 && (
                        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-4 border-blue-400">
                          <div className="flex items-center gap-3 mb-4">
                            <Users size={28} className="text-blue-600" />
                            <span className="text-xl font-black text-blue-800 uppercase">점수 적용 후 현황</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {allTeams
                              .map(team => {
                                const ranking = aiComparativeResult.rankings.find(r => r.teamId === team.id);
                                const currentScore = team.score ?? 100;
                                const addedScore = ranking?.score ?? 0;
                                const newScore = currentScore + addedScore;
                                return { ...team, currentScore, addedScore, newScore };
                              })
                              .sort((a, b) => b.newScore - a.newScore)
                              .map((team, index) => (
                                <div
                                  key={team.id}
                                  className={`p-4 rounded-xl border-3 text-center ${
                                    index === 0 ? 'bg-yellow-100 border-yellow-500' :
                                    index === 1 ? 'bg-gray-100 border-gray-400' :
                                    index === 2 ? 'bg-orange-100 border-orange-400' :
                                    'bg-white border-gray-300'
                                  }`}
                                >
                                  <div className="text-lg font-bold text-gray-700 mb-1">{team.name}</div>
                                  <div className="text-3xl font-black text-blue-800">{team.newScore}점</div>
                                  <div className="text-base font-medium text-green-600 mt-1">
                                    ({team.currentScore} + {team.addedScore})
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* 결과 적용 버튼 */}
                      {onApplyResults && (
                        <button
                          onClick={onApplyResults}
                          className="w-full mt-5 py-5 bg-green-600 hover:bg-green-700 text-white text-2xl font-black uppercase border-4 border-black flex items-center justify-center gap-3 transition-all shadow-hard"
                        >
                          <CheckCircle2 size={28} /> 점수 적용 & 다음 턴
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 일반 뷰 (팀원/미리보기): 선택지 및 입력 UI */}
              {!isAdminView && (
                <>
                  {/* 관람자 투표 안내 (readOnly 모드에서 투표 가능한 경우) */}
                  {readOnly && onSpectatorVote && !isOpenEnded && (
                    <div className="bg-purple-100 border-4 border-purple-500 p-3 text-center mb-4">
                      <span className="font-bold text-purple-800">
                        💡 나도 선택에 참여할 수 있습니다! (투표만, 점수 반영 없음)
                      </span>
                    </div>
                  )}

                  {!isOpenEnded ? (
                    <>
                      <h3 className="text-black text-sm font-bold uppercase tracking-widest">1. 당신의 선택은?</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {card.choices?.map((choice) => {
                          const voterTeams = spectatorVotes[choice.id] || [];
                          const hasVotes = voterTeams.length > 0;
                          const isMySpectatorVote = spectatorVote?.id === choice.id;
                          const canVote = readOnly && onSpectatorVote;

                          return (
                            <button
                              key={choice.id}
                              onClick={() => {
                                if (!readOnly) {
                                  onSelectionChange(choice);
                                } else if (onSpectatorVote) {
                                  onSpectatorVote(choice);
                                }
                              }}
                              disabled={readOnly && !onSpectatorVote}
                              className={`group relative flex flex-col items-start p-4 border-4 transition-all text-left h-full
                                ${selectedChoice?.id === choice.id
                                  ? 'border-blue-600 bg-blue-50 shadow-hard transform -translate-y-1'
                                  : isMySpectatorVote
                                    ? 'border-purple-600 bg-purple-50 shadow-hard transform -translate-y-1'
                                    : 'border-black hover:bg-gray-50'
                                }
                                ${readOnly && !canVote ? 'cursor-not-allowed opacity-70' : ''}
                                ${canVote ? 'cursor-pointer hover:border-purple-400' : ''}
                              `}
                            >
                              {/* 옵션 ID 배지 */}
                              <div className={`absolute top-0 right-0 px-3 py-1 text-sm font-bold border-b-2 border-l-2
                                ${selectedChoice?.id === choice.id
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : isMySpectatorVote
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-black text-white border-black'}`}>
                                {choice.id}
                              </div>

                              {/* 내 투표 배지 */}
                              {isMySpectatorVote && (
                                <div className="absolute top-0 left-0 bg-purple-600 text-white px-2 py-1 text-xs font-bold border-b-2 border-r-2 border-purple-800">
                                  MY VOTE
                                </div>
                              )}

                              {/* 관람자 투표 팀 배지 (있을 때만 표시, 내 투표가 없을 때) */}
                              {hasVotes && !isMySpectatorVote && (
                                <div className="absolute top-0 left-0 bg-purple-500 text-white px-2 py-1 text-xs font-bold border-b-2 border-r-2 border-purple-700 flex items-center gap-1">
                                  <span>👥</span>
                                  <span>{voterTeams.length}</span>
                                </div>
                              )}

                              <h4 className="text-xl md:text-2xl font-bold mt-6 leading-tight">{choice.text}</h4>

                              {/* 투표한 팀 목록 */}
                              {hasVotes && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {voterTeams.map((name, idx) => (
                                    <span key={idx} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-purple-900 font-bold bg-purple-100 p-4 border-2 border-purple-900">
                      <MessageSquare />
                      <span>이 질문은 주관식 답변입니다. 자유롭게 의견을 서술해주세요.</span>
                    </div>
                  )}

                  <div className={`transition-all duration-300 ${isOpenEnded || selectedChoice ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      <h3 className="text-black text-sm font-bold uppercase tracking-widest mb-2 mt-6">
                        {isOpenEnded ? "2. 당신의 생각은?" : "2. 선택 이유는?"}
                      </h3>
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={reasoning}
                          onChange={(e) => !readOnly && onReasoningChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={readOnly ? "다른 팀이 입력 중..." : (isOpenEnded ? "여기에 답변을 입력하세요..." : (selectedChoice ? "팀이 모바일에서 입력중일 수 있습니다..." : "먼저 선택지를 고르세요."))}
                          className={`w-full h-32 p-4 border-4 border-black font-medium focus:outline-none focus:bg-yellow-50 resize-none text-lg ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          disabled={isProcessing || readOnly}
                          readOnly={readOnly}
                        />
                      </div>

                      {!readOnly && (
                        <button
                          onClick={onSubmit}
                          disabled={(!isOpenEnded && !selectedChoice) || !reasoning.trim() || isProcessing}
                          className="w-full mt-4 py-4 bg-black text-white text-xl font-black uppercase border-4 border-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                        >
                          {isProcessing ? (
                            <>
                              <Sparkles className="animate-spin" /> AI Processing...
                            </>
                          ) : (
                            <>
                              <Send size={20} /> AI 리더의 평가(클릭)
                            </>
                          )}
                        </button>
                      )}

                      {readOnly && isProcessing && (
                        <div className="w-full mt-4 py-4 bg-gray-600 text-white text-xl font-black uppercase border-4 border-black flex items-center justify-center gap-3">
                          <Sparkles className="animate-spin" /> AI 평가 중...
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Result Phase - 응답 내용 + AI 결과 표시 */
            <div className="animate-in fade-in zoom-in duration-300 space-y-6">

               {/* 옵션 선택 현황 (전체 옵션 + 팀 선택 + 다른 팀 투표) */}
               {!isOpenEnded && card.choices && (
                 <div className="bg-gray-50 border-4 border-gray-300 p-4">
                   <div className="text-xs font-bold text-gray-700 uppercase mb-3">
                     옵션 선택 현황
                   </div>
                   <div className="space-y-3">
                     {card.choices.map((choice) => {
                       const voterTeams = spectatorVotes[choice.id] || [];
                       const isSelected = selectedChoice?.id === choice.id;

                       return (
                         <div
                           key={choice.id}
                           className={`p-3 rounded-lg transition-all ${
                             isSelected
                               ? 'bg-blue-100 border-2 border-blue-600 shadow-md'
                               : 'bg-white border-2 border-gray-200'
                           }`}
                         >
                           <div className="flex items-start justify-between gap-2">
                             <div className="flex items-center gap-2 flex-1">
                               <span className={`px-3 py-1 text-sm font-bold shrink-0 ${
                                 isSelected ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                               }`}>
                                 {choice.id}
                               </span>
                               <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                 {choice.text}
                               </span>
                             </div>
                             {isSelected && (
                               <span className="bg-green-500 text-white text-[10px] px-2 py-1 font-bold uppercase rounded shrink-0">
                                 {teamName} 선택
                               </span>
                             )}
                           </div>
                           {/* 다른 팀 투표 표시 */}
                           {voterTeams.length > 0 && (
                             <div className="mt-2 flex flex-wrap gap-1">
                               {voterTeams.map((voterName, idx) => (
                                 <span
                                   key={idx}
                                   className="bg-purple-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold"
                                 >
                                   👥 {voterName}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}

               {/* 팀 응답 내용 표시 */}
               <div className="bg-blue-50 border-4 border-blue-900 p-6">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="bg-blue-900 text-white p-2 rounded-full"><MessageSquare size={20} /></div>
                   <h3 className="text-lg font-black uppercase text-blue-900">
                     {teamName ? `${teamName}의 응답` : '팀 응답'}
                   </h3>
                 </div>

                 {/* 선택한 옵션 표시 (주관식일 때만 표시, 객관식은 위에서 이미 표시됨) */}
                 {isOpenEnded && selectedChoice && (
                   <div className="mb-4">
                     <div className="text-xs font-bold text-blue-700 uppercase mb-1">선택한 옵션</div>
                     <div className="bg-white border-2 border-blue-300 p-3 font-bold">
                       <span className="bg-blue-900 text-white px-2 py-0.5 text-xs mr-2">{selectedChoice.id}</span>
                       {selectedChoice.text}
                     </div>
                   </div>
                 )}

                 {/* 응답 내용 표시 */}
                 <div>
                   <div className="text-xs font-bold text-blue-700 uppercase mb-1">
                     {selectedChoice ? '선택 이유' : '응답 내용'}
                   </div>
                   <div className="bg-white border-2 border-blue-300 p-3 font-medium whitespace-pre-wrap">
                     {reasoning || '(응답 내용 없음)'}
                   </div>
                 </div>
               </div>

               {/* AI 평가 결과 */}
               <div className="bg-gray-100 border-4 border-black p-6">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="bg-black text-white p-2 rounded-full"><Sparkles size={24} /></div>
                   <h3 className="text-xl font-black uppercase">AI Evaluation Result</h3>
                 </div>
                 <div className="text-base leading-relaxed mb-6 space-y-3">
                   {result.feedback.split(/(\*\*\[.+?\]\*\*)/).map((part, idx) => {
                     // 섹션 헤더 처리 (**[장점]**, **[리스크]**, **[총평]**, **[모범답안]**)
                     if (part.match(/^\*\*\[.+?\]\*\*$/)) {
                       const label = part.replace(/\*\*/g, '').replace(/[\[\]]/g, '');
                       const colorClass = label.includes('장점')
                         ? 'text-green-700 bg-green-100 border-green-300'
                         : label.includes('리스크')
                           ? 'text-red-700 bg-red-100 border-red-300'
                           : label.includes('모범답안')
                             ? 'text-purple-700 bg-purple-100 border-purple-300'
                             : 'text-blue-700 bg-blue-100 border-blue-300';
                       return (
                         <div key={idx} className={`inline-block px-3 py-1 rounded font-black text-sm border-2 mt-2 ${colorClass}`}>
                           {label}
                         </div>
                       );
                     }
                     // 일반 텍스트
                     if (part.trim()) {
                       return <p key={idx} className="font-medium text-gray-800">{part.trim()}</p>;
                     }
                     return null;
                   })}
                 </div>

               </div>

               {/* 미리보기 모드일 때 */}
               {isPreviewMode && onClose && (
                 <>
                   <div className="bg-orange-100 border-4 border-orange-500 p-4 text-center mb-4">
                     <span className="font-bold text-orange-800">
                       ⚠️ 미리보기 모드 - 이 결과는 게임에 반영되지 않습니다
                     </span>
                   </div>
                   <button onClick={onClose} className="w-full py-4 bg-gray-700 text-white font-black text-xl border-4 border-black hover:bg-gray-600 shadow-hard">
                     닫기
                   </button>
                 </>
               )}

               {/* 읽기 전용 모드가 아니고 미리보기 모드도 아닐 때 버튼 표시 */}
               {!readOnly && !isPreviewMode && onClose && (
                 <button onClick={onClose} className="w-full py-4 bg-blue-900 text-white font-black text-xl border-4 border-black hover:bg-blue-800 shadow-hard">
                   ACCEPT & CONTINUE
                 </button>
               )}

               {/* 읽기 전용 모드일 때 */}
               {readOnly && (
                 <div className="text-center py-4 bg-gray-200 border-4 border-gray-400 font-bold text-gray-600">
                   다른 팀의 턴을 관람 중입니다
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardModal;