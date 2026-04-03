import React, { useState, useEffect } from 'react';
import { GameVersion, GameCard, Choice } from '../types';

// ============================================================
// Props
// ============================================================

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameVersion;
  customCards: GameCard[];
  customBoardImage?: string;
  sessionId?: string;
  aiEvaluationGuidelines?: string;
  onSaveCards: (
    cards: GameCard[],
    customBoardImage: string | undefined,
    aiEvaluationGuidelines: string | undefined
  ) => void;
}

// ============================================================
// Component
// ============================================================

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  gameMode,
  customCards,
  customBoardImage,
  sessionId,
  aiEvaluationGuidelines,
  onSaveCards,
}) => {
  const [editableCards, setEditableCards] = useState<GameCard[]>([]);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [boardImageUrl, setBoardImageUrl] = useState<string>(customBoardImage || '');
  const [guidelines, setGuidelines] = useState<string>(aiEvaluationGuidelines || '');

  // Sync state when props change
  useEffect(() => {
    setEditableCards(customCards.map((c) => ({ ...c })));
  }, [customCards]);

  useEffect(() => {
    setBoardImageUrl(customBoardImage || '');
  }, [customBoardImage]);

  useEffect(() => {
    setGuidelines(aiEvaluationGuidelines || '');
  }, [aiEvaluationGuidelines]);

  if (!isOpen) return null;

  // ============================================================
  // Card editing helpers
  // ============================================================

  const updateCard = (cardId: string, updates: Partial<GameCard>) => {
    setEditableCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c))
    );
  };

  const updateChoice = (cardId: string, choiceIndex: number, text: string) => {
    setEditableCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const newChoices = [...(c.choices || [])];
        if (newChoices[choiceIndex]) {
          newChoices[choiceIndex] = { ...newChoices[choiceIndex], text };
        }
        return { ...c, choices: newChoices };
      })
    );
  };

  const addChoice = (cardId: string) => {
    setEditableCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const existing = c.choices || [];
        const newChoice: Choice = {
          id: `${cardId}-choice-${existing.length + 1}`,
          text: '',
        };
        return { ...c, choices: [...existing, newChoice] };
      })
    );
  };

  const removeChoice = (cardId: string, choiceIndex: number) => {
    setEditableCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const newChoices = [...(c.choices || [])];
        newChoices.splice(choiceIndex, 1);
        return { ...c, choices: newChoices };
      })
    );
  };

  const addCard = () => {
    const newId = `custom-${Date.now()}`;
    const newCard: GameCard = {
      id: newId,
      type: 'Custom',
      title: '새 카드',
      situation: '',
      choices: [
        { id: `${newId}-a`, text: '선택지 A' },
        { id: `${newId}-b`, text: '선택지 B' },
      ],
      learningPoint: '',
    };
    setEditableCards((prev) => [...prev, newCard]);
    setEditingCardId(newId);
  };

  const removeCard = (cardId: string) => {
    setEditableCards((prev) => prev.filter((c) => c.id !== cardId));
    if (editingCardId === cardId) {
      setEditingCardId(null);
    }
  };

  const handleSave = () => {
    onSaveCards(
      editableCards,
      boardImageUrl.trim() || undefined,
      guidelines.trim() || undefined
    );
  };

  const editingCard = editingCardId
    ? editableCards.find((c) => c.id === editingCardId)
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white w-full h-full max-w-6xl max-h-[95vh] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-3 border-b-4 border-black flex-shrink-0">
          <div>
            <h2 className="text-lg font-black uppercase">관리자 대시보드</h2>
            <div className="text-[10px] font-bold text-gray-400">
              {gameMode} {sessionId && `| 세션: ${sessionId}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-green-400 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              저장
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white text-black border-2 border-black font-black text-lg flex items-center justify-center hover:bg-red-100 transition-colors"
            >
              X
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Card list */}
          <div className="w-1/3 border-r-4 border-black flex flex-col min-h-0">
            <div className="flex items-center justify-between p-2 border-b-2 border-black bg-gray-50 flex-shrink-0">
              <span className="text-xs font-black uppercase">
                카드 목록 ({editableCards.length})
              </span>
              <button
                onClick={addCard}
                className="px-2 py-1 bg-blue-400 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                + 추가
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {editableCards.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm font-bold">
                  카드가 없습니다. 추가 버튼을 눌러주세요.
                </div>
              )}
              {editableCards.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => setEditingCardId(card.id)}
                  className={`p-2 border-b-2 border-black cursor-pointer transition-colors ${
                    editingCardId === card.id
                      ? 'bg-yellow-200'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-400 font-bold">#{idx + 1}</div>
                      <div className="text-xs font-black truncate">{card.title}</div>
                      {card.competency && (
                        <span className="inline-block mt-0.5 px-1 py-0 bg-blue-100 border border-black text-[8px] font-bold">
                          {card.competency}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCard(card.id);
                      }}
                      className="w-5 h-5 bg-red-400 border border-black text-[10px] font-black flex items-center justify-center hover:bg-red-500 flex-shrink-0"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
            {editingCard ? (
              <>
                <div className="text-xs font-black text-gray-500 uppercase">카드 편집</div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                    제목
                  </label>
                  <input
                    type="text"
                    value={editingCard.title}
                    onChange={(e) => updateCard(editingCard.id, { title: e.target.value })}
                    className="w-full border-2 border-black px-2 py-1.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {/* Competency */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                    역량
                  </label>
                  <input
                    type="text"
                    value={editingCard.competency || ''}
                    onChange={(e) =>
                      updateCard(editingCard.id, { competency: e.target.value || undefined })
                    }
                    placeholder="역량 입력 (선택사항)"
                    className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {/* Situation */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                    상황
                  </label>
                  <textarea
                    value={editingCard.situation}
                    onChange={(e) =>
                      updateCard(editingCard.id, { situation: e.target.value })
                    }
                    rows={4}
                    className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {/* Choices */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      선택지 ({editingCard.choices?.length || 0})
                    </label>
                    <button
                      onClick={() => addChoice(editingCard.id)}
                      className="px-2 py-0.5 bg-blue-300 border border-black text-[10px] font-black hover:bg-blue-400 transition-colors"
                    >
                      + 선택지 추가
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(editingCard.choices || []).map((choice, cIdx) => (
                      <div key={choice.id} className="flex gap-1">
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) =>
                            updateChoice(editingCard.id, cIdx, e.target.value)
                          }
                          placeholder={`선택지 ${cIdx + 1}`}
                          className="flex-1 border-2 border-black px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                          onClick={() => removeChoice(editingCard.id, cIdx)}
                          className="w-7 h-7 bg-red-400 border border-black text-[10px] font-black flex items-center justify-center hover:bg-red-500 flex-shrink-0"
                        >
                          X
                        </button>
                      </div>
                    ))}
                    {(!editingCard.choices || editingCard.choices.length === 0) && (
                      <div className="text-[10px] text-gray-400 italic">
                        선택지 없음 (자유 응답 모드)
                      </div>
                    )}
                  </div>
                </div>

                {/* Learning Point */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                    학습 포인트
                  </label>
                  <textarea
                    value={editingCard.learningPoint}
                    onChange={(e) =>
                      updateCard(editingCard.id, { learningPoint: e.target.value })
                    }
                    rows={3}
                    className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Settings when no card selected */}
                <div className="text-xs font-black text-gray-500 uppercase">일반 설정</div>

                {/* Board image */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                    커스텀 보드 이미지 URL
                  </label>
                  <input
                    type="text"
                    value={boardImageUrl}
                    onChange={(e) => setBoardImageUrl(e.target.value)}
                    placeholder="https://example.com/board-image.jpg"
                    className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  {boardImageUrl && (
                    <div className="mt-2 border-2 border-black p-1">
                      <img
                        src={boardImageUrl}
                        alt="Board preview"
                        className="max-h-32 w-auto mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* AI Guidelines */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                    AI 평가 지침
                  </label>
                  <textarea
                    value={guidelines}
                    onChange={(e) => setGuidelines(e.target.value)}
                    rows={10}
                    placeholder="AI 평가 시 참고할 지침을 입력하세요..."
                    className="w-full border-2 border-black px-2 py-1.5 text-xs font-bold resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                  />
                </div>

                <div className="text-center text-gray-400 text-xs font-bold mt-8">
                  왼쪽 목록에서 카드를 선택하여 편집하세요.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
