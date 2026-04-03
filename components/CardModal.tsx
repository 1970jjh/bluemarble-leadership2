import React from 'react';
import {
  GameCard,
  Choice,
  AIEvaluationResult,
  TeamResponse,
  AIComparativeResult,
} from '../types';

// ============================================================
// Props
// ============================================================

interface CardModalProps {
  card: GameCard;
  visible: boolean;
  timeLeft: number;
  selectedChoice: Choice | null;
  reasoning: string;
  onSelectionChange: (choice: Choice) => void;
  onReasoningChange: (text: string) => void;
  onSubmit: () => void;
  result: AIEvaluationResult | null;
  isProcessing: boolean;
  onClose: () => void;
  teamName?: string;
  isAdminView?: boolean;
  isTeamSaved?: boolean;
  onAISubmit?: () => void;
  isRiskCardMode?: boolean;
  scoreMultiplier?: number;
  allTeamResponses?: { [teamId: string]: TeamResponse };
  allTeams?: { id: string; name: string; score: number }[];
  isResponsesRevealed?: boolean;
  aiComparativeResult?: AIComparativeResult | null;
  isComparingTeams?: boolean;
  onRevealResponses?: () => void;
  onCompareTeams?: () => void;
  onApplyResults?: () => void;
  isPreviewMode?: boolean;
}

// ============================================================
// Component
// ============================================================

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
  teamName,
  isAdminView,
  isTeamSaved,
  onAISubmit,
  isRiskCardMode,
  scoreMultiplier,
  allTeamResponses,
  allTeams,
  isResponsesRevealed,
  aiComparativeResult,
  isComparingTeams,
  onRevealResponses,
  onCompareTeams,
  onApplyResults,
  isPreviewMode,
}) => {
  if (!visible) return null;

  const hasChoices = card.choices && card.choices.length > 0;
  const submittedCount = allTeamResponses
    ? Object.values(allTeamResponses).filter((r: any) => r.isSubmitted).length
    : 0;
  const totalTeamCount = allTeams?.length || 0;

  const multiplier = scoreMultiplier && scoreMultiplier > 1 ? scoreMultiplier : null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-4 border-black p-4 z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {teamName && (
                <div className="text-xs font-bold text-gray-500 mb-1">{teamName}</div>
              )}
              <h2 className="text-xl font-black leading-tight">{card.title}</h2>
              {card.competency && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 border-2 border-black text-[10px] font-black uppercase">
                  {card.competency}
                </span>
              )}
              {isPreviewMode && (
                <span className="inline-block mt-1 ml-1 px-2 py-0.5 bg-gray-200 border-2 border-black text-[10px] font-black uppercase">
                  미리보기
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Timer */}
              {timeLeft > 0 && (
                <div
                  className={`px-3 py-1 border-2 border-black font-black text-lg tabular-nums ${
                    timeLeft <= 10
                      ? 'bg-red-400 text-white animate-pulse'
                      : timeLeft <= 30
                      ? 'bg-yellow-300'
                      : 'bg-gray-100'
                  }`}
                >
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              )}
              {/* Multiplier badge */}
              {multiplier && (
                <div className="px-2 py-1 bg-red-500 text-white border-2 border-black font-black text-sm">
                  x{multiplier}
                </div>
              )}
              {/* Close button */}
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white border-2 border-black font-black text-lg flex items-center justify-center hover:bg-red-100 transition-colors"
              >
                X
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Situation */}
          <div className="bg-gray-50 border-2 border-black p-3">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">상황</div>
            <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">
              {card.situation}
            </p>
          </div>

          {/* Risk card indicator */}
          {isRiskCardMode && (
            <div className="bg-red-50 border-2 border-red-400 p-2 text-center">
              <span className="text-sm font-black text-red-600">리스크 카드</span>
            </div>
          )}

          {/* Choices */}
          {hasChoices ? (
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase">선택지</div>
              {card.choices!.map((choice) => {
                const isSelected = selectedChoice?.id === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => onSelectionChange(choice)}
                    className={`w-full text-left p-3 border-2 border-black font-bold text-sm transition-all ${
                      isSelected
                        ? 'bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">자유 응답</div>
              <textarea
                value={selectedChoice?.text || ''}
                onChange={(e) =>
                  onSelectionChange({ id: 'open-ended', text: e.target.value })
                }
                placeholder="자유롭게 의견을 작성하세요..."
                className="w-full h-24 border-2 border-black p-2 text-sm font-bold resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          )}

          {/* Reasoning */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">
              이유 / 근거
            </div>
            <textarea
              value={reasoning}
              onChange={(e) => onReasoningChange(e.target.value)}
              placeholder="선택의 이유를 설명해주세요..."
              className="w-full h-20 border-2 border-black p-2 text-sm font-bold resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Submit / Save button */}
          {!result && (
            <button
              onClick={onSubmit}
              disabled={isProcessing || (!selectedChoice && hasChoices)}
              className={`w-full py-3 border-4 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all ${
                isProcessing || (!selectedChoice && hasChoices)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isTeamSaved
                  ? 'bg-green-400'
                  : 'bg-blue-400 hover:bg-blue-500'
              }`}
            >
              {isProcessing ? '처리 중...' : isTeamSaved ? '저장 완료' : '제출 / 저장'}
            </button>
          )}

          {/* ============================================================ */}
          {/* Admin Section */}
          {/* ============================================================ */}
          {isAdminView && (
            <div className="border-t-4 border-black pt-4 mt-4 space-y-3">
              <div className="text-xs font-black text-gray-500 uppercase">관리자 영역</div>

              {/* AI Analysis button */}
              {isTeamSaved && onAISubmit && !result && (
                <button
                  onClick={onAISubmit}
                  disabled={isProcessing}
                  className={`w-full py-2 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all ${
                    isProcessing
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-purple-400 hover:bg-purple-500'
                  }`}
                >
                  {isProcessing ? 'AI 분석 중...' : 'AI 분석'}
                </button>
              )}

              {/* AI Result display */}
              {result && (
                <div className="bg-purple-50 border-2 border-purple-400 p-3 space-y-2">
                  <div className="text-[10px] font-black text-purple-600 uppercase">
                    AI 분석 결과
                  </div>
                  <p className="text-sm font-bold whitespace-pre-wrap">{result.feedback}</p>
                  {result.scoreChanges && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(result.scoreChanges).map(([key, val]) => (
                        <span
                          key={key}
                          className={`px-2 py-0.5 border border-black text-[10px] font-black ${
                            (val as number) > 0 ? 'bg-green-200' : (val as number) < 0 ? 'bg-red-200' : 'bg-gray-200'
                          }`}
                        >
                          {key}: {(val as number) > 0 ? '+' : ''}
                          {val as number}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Apply button */}
                  <button
                    onClick={onClose}
                    className="w-full py-2 bg-green-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all mt-2"
                  >
                    적용
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* Simultaneous Response Section */}
              {/* ============================================================ */}
              {allTeamResponses && allTeams && allTeams.length > 0 && (
                <div className="border-t-2 border-dashed border-gray-400 pt-3 space-y-2">
                  <div className="text-[10px] font-black text-gray-500 uppercase">
                    동시 응답 시스템
                  </div>

                  {/* Submitted count */}
                  <div className="flex items-center justify-between bg-gray-50 border-2 border-black px-3 py-2">
                    <span className="text-xs font-bold">제출 현황</span>
                    <span className="font-black text-sm">
                      {submittedCount} / {totalTeamCount}
                    </span>
                  </div>

                  {/* Reveal button */}
                  {onRevealResponses && !isResponsesRevealed && (
                    <button
                      onClick={onRevealResponses}
                      disabled={submittedCount === 0}
                      className={`w-full py-2 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all ${
                        submittedCount === 0
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-yellow-400 hover:bg-yellow-500'
                      }`}
                    >
                      공개
                    </button>
                  )}

                  {/* Revealed responses */}
                  {isResponsesRevealed && (
                    <div className="space-y-1">
                      {allTeams.map((team) => {
                        const resp = allTeamResponses[team.id];
                        return (
                          <div
                            key={team.id}
                            className={`border-2 border-black p-2 text-xs ${
                              resp?.isSubmitted ? 'bg-white' : 'bg-gray-100'
                            }`}
                          >
                            <div className="font-black">{team.name}</div>
                            {resp?.isSubmitted ? (
                              <>
                                <div className="font-bold text-gray-700 mt-0.5">
                                  {resp.selectedChoice?.text || '(자유 응답)'}
                                </div>
                                {resp.reasoning && (
                                  <div className="text-gray-500 mt-0.5 italic">
                                    {resp.reasoning}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-gray-400 italic">미제출</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Compare button */}
                  {isResponsesRevealed && onCompareTeams && !aiComparativeResult && (
                    <button
                      onClick={onCompareTeams}
                      disabled={isComparingTeams}
                      className={`w-full py-2 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all ${
                        isComparingTeams
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-purple-400 hover:bg-purple-500'
                      }`}
                    >
                      {isComparingTeams ? '비교 분석 중...' : '비교 분석'}
                    </button>
                  )}

                  {/* Comparative AI result */}
                  {aiComparativeResult && (
                    <div className="bg-purple-50 border-2 border-purple-400 p-3 space-y-2">
                      <div className="text-[10px] font-black text-purple-600 uppercase">
                        AI 비교 분석 결과
                      </div>
                      {aiComparativeResult.rankings.map((ranking, idx) => (
                        <div
                          key={ranking.teamId}
                          className="bg-white border border-black p-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black">
                              {ranking.rank}위 - {ranking.teamName}
                            </span>
                            <span className="font-black text-blue-600">
                              {ranking.score}점
                            </span>
                          </div>
                          <div className="text-gray-600 mt-0.5">{ranking.feedback}</div>
                        </div>
                      ))}
                      {aiComparativeResult.guidance && (
                        <div className="bg-yellow-50 border border-yellow-400 p-2 text-xs font-bold">
                          {aiComparativeResult.guidance}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Apply results button */}
                  {aiComparativeResult && onApplyResults && (
                    <button
                      onClick={onApplyResults}
                      className="w-full py-2 bg-green-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      점수 적용
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Learning Point (shown after result) */}
          {result && card.learningPoint && (
            <div className="bg-blue-50 border-2 border-blue-400 p-3">
              <div className="text-[10px] font-black text-blue-600 uppercase mb-1">
                학습 포인트
              </div>
              <p className="text-sm font-bold">{card.learningPoint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardModal;
