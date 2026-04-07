import React, { useState, useEffect, useRef } from 'react';
import {
  GameCard,
  CompetencyInfo,
  GameVersion,
  Choice,
  SquareType
} from '../types';
import {
  EVENT_CARDS,
  COMPETENCY_INFO,
  BOARD_SQUARES,
  DEFAULT_AI_EVALUATION_GUIDELINES,
} from '../constants';
import {
  Settings,
  Edit3,
  Save,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  Wand2,
  Download,
  Upload,
  FileJson,
  ImagePlus,
  Loader2
} from 'lucide-react';
import { uploadBoardImage } from '../lib/storage';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameVersion;
  customCards: GameCard[];
  onSaveCards: (cards: GameCard[], customBoardImage?: string, aiEvaluationGuidelines?: string) => void;
  customBoardImage?: string;  // 커스텀 모드용 배경 이미지 URL
  sessionId?: string;  // 세션 ID (이미지 업로드 경로용)
  aiEvaluationGuidelines?: string;  // AI 평가 지침
}

// 확장된 카드 타입 (역량명 포함)
interface ExtendedGameCard extends GameCard {
  competencyNameKo?: string;
  competencyNameEn?: string;
  boardIndex?: number;  // 보드 위치
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  gameMode,
  customCards,
  onSaveCards,
  customBoardImage: initialBoardImage,
  sessionId,
  aiEvaluationGuidelines: initialAiGuidelines
}) => {
  // 커스텀 모드용 기본 카드 가져오기 (보드 순서대로 정렬)
  const getDefaultCards = (): ExtendedGameCard[] => {
    // 31개의 빈 커스텀 카드 생성 (출발 칸 제외한 모든 칸)
    const customEmptyCards: ExtendedGameCard[] = [];
    // 출발 칸(index 0) 제외한 모든 칸
    const allSquaresExceptStart = BOARD_SQUARES.filter(s => s.type !== SquareType.Start);
    // boardIndex 순으로 정렬
    allSquaresExceptStart.sort((a, b) => a.index - b.index);

    allSquaresExceptStart.forEach((square, idx) => {
      customEmptyCards.push({
        id: `custom-${idx + 1}`,
        type: 'Custom',
        title: `카드 ${idx + 1}`,
        situation: '상황을 입력하세요...',
        choices: [
          { id: 'A', text: '선택지 A' },
          { id: 'B', text: '선택지 B' },
          { id: 'C', text: '선택지 C' }
        ],
        learningPoint: '학습 포인트를 입력하세요...',
        competencyNameKo: `카드 ${idx + 1}`,
        competencyNameEn: `Card ${idx + 1}`,
        boardIndex: square.index
      });
    });
    // 커스텀 모드에서는 이벤트 카드를 추가하지 않음 (31개 칸 모두 커스텀 카드 사용)
    return customEmptyCards;
  };

  // 상태 관리
  const [cards, setCards] = useState<ExtendedGameCard[]>([]);
  const [editingCard, setEditingCard] = useState<ExtendedGameCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'competency' | 'event'>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // AI 생성 관련 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInputName, setAiInputName] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  // JSON 파일 업로드 관련
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // 커스텀 모드용 배경 이미지
  const [boardImage, setBoardImage] = useState(initialBoardImage || '');

  // AI 평가 지침 (수정 가능)
  const [aiGuidelines, setAiGuidelines] = useState(initialAiGuidelines || DEFAULT_AI_EVALUATION_GUIDELINES);
  const [showAiGuidelines, setShowAiGuidelines] = useState(false);

  // 이미지 파일 업로드 관련
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 초기화: 커스텀 카드가 있으면 사용, 없으면 기본 카드 사용
  useEffect(() => {
    if (customCards && customCards.length > 0) {
      // 커스텀 카드에 역량명 정보 추가
      const extendedCustomCards = customCards.map(card => {
        const competencyInfo = card.competency ? COMPETENCY_INFO.find(c => c.id === card.competency) : null;
        return {
          ...card,
          competencyNameKo: (card as ExtendedGameCard).competencyNameKo || competencyInfo?.nameKo || '',
          competencyNameEn: (card as ExtendedGameCard).competencyNameEn || competencyInfo?.nameEn || ''
        };
      });
      setCards(extendedCustomCards);
    } else {
      setCards(getDefaultCards());
    }
  }, [gameMode, customCards]);

  // 필터링된 카드 목록
  const filteredCards = cards.filter(card => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.situation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.competency && card.competency.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.competencyNameKo && card.competencyNameKo.includes(searchTerm));

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'competency' && card.competency) ||
      (filterType === 'event' && !card.competency);

    return matchesSearch && matchesFilter;
  });

  // 카드 편집 시작
  const handleEditCard = (card: ExtendedGameCard) => {
    setEditingCard({ ...card });
    setShowAiInput(false);
    setAiInputName(card.competencyNameKo || '');
  };

  // 카드 편집 저장
  const handleSaveCard = () => {
    if (!editingCard) return;

    const updatedCards = cards.map(card =>
      card.id === editingCard.id ? editingCard : card
    );
    setCards(updatedCards);
    setEditingCard(null);
    setHasChanges(true);
  };

  // 전체 저장
  const handleSaveAll = async () => {
    setSaveStatus('saving');
    try {
      // AI 지침이 기본값과 같으면 undefined로 저장 (공간 절약)
      const guidelinesToSave = aiGuidelines === DEFAULT_AI_EVALUATION_GUIDELINES ? undefined : aiGuidelines;
      await onSaveCards(cards as GameCard[], boardImage || undefined, guidelinesToSave);
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 기본값으로 초기화
  const handleReset = () => {
    if (confirm('모든 변경사항이 초기화됩니다. 계속하시겠습니까?')) {
      setCards(getDefaultCards());
      setHasChanges(true);
    }
  };

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (3MB)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('파일 크기가 너무 큽니다. 최대 3MB까지 업로드 가능합니다.');
      return;
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP만 가능합니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // sessionId가 없으면 임시 ID 생성
      const uploadSessionId = sessionId || `temp_${Date.now()}`;
      const result = await uploadBoardImage(file, uploadSessionId);

      if (result.success && result.url) {
        setBoardImage(result.url);
        setHasChanges(true);
        setUploadError(null);
      } else {
        setUploadError(result.error || '업로드에 실패했습니다.');
      }
    } catch (error: any) {
      setUploadError(error.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // JSON 내보내기 (다운로드)
  const handleExportJSON = () => {
    // 커스텀 모드: 모든 카드 내보내기
    const cardsToExport = cards;

    // 내보내기용 간소화된 형식으로 변환
    const exportData = cardsToExport.map(card => ({
      id: card.id,
      type: card.type,
      competency: card.competency,
      competencyNameKo: card.competencyNameKo || '',
      competencyNameEn: card.competencyNameEn || '',
      title: card.title,
      situation: card.situation,
      choices: card.choices || [],
      learningPoint: card.learningPoint,
      boardIndex: card.boardIndex
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `custom_cards_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON 가져오기 (업로드)
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedCards = JSON.parse(content);

        // 유효성 검사
        if (!Array.isArray(importedCards)) {
          throw new Error('JSON 파일은 배열 형식이어야 합니다.');
        }

        if (importedCards.length === 0) {
          throw new Error('가져올 카드가 없습니다.');
        }

        // 각 카드 유효성 검사
        const validatedCards: ExtendedGameCard[] = [];
        const errors: string[] = [];

        importedCards.forEach((card: any, index: number) => {
          // 필수 필드 검사
          if (!card.id) {
            errors.push(`카드 ${index + 1}: id가 없습니다.`);
            return;
          }
          if (!card.title) {
            errors.push(`카드 ${index + 1}: title이 없습니다.`);
            return;
          }
          if (!card.situation) {
            errors.push(`카드 ${index + 1}: situation이 없습니다.`);
            return;
          }

          // 선택지 유효성 검사
          if (card.choices && !Array.isArray(card.choices)) {
            errors.push(`카드 ${index + 1}: choices는 배열이어야 합니다.`);
            return;
          }

          // 유효한 카드 추가
          const existingCard = cards.find(c => c.id === card.id);
          validatedCards.push({
            id: card.id,
            type: card.type || existingCard?.type || 'CoreValue',
            competency: card.competency || existingCard?.competency,
            competencyNameKo: card.competencyNameKo || '',
            competencyNameEn: card.competencyNameEn || '',
            title: card.title,
            situation: card.situation,
            choices: card.choices?.map((c: any) => ({
              id: c.id || String.fromCharCode(65 + validatedCards.length),
              text: c.text || ''
            })) || existingCard?.choices || [],
            learningPoint: card.learningPoint || '',
            boardIndex: card.boardIndex
          });
        });

        if (errors.length > 0) {
          setImportStatus('error');
          setImportMessage(`오류:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... 외 ${errors.length - 3}개` : ''}`);
          setTimeout(() => setImportStatus('idle'), 5000);
          return;
        }

        // 커스텀 모드: 가져온 카드로 완전히 대체
        setCards(validatedCards);
        setHasChanges(true);
        setImportStatus('success');
        setImportMessage(`${validatedCards.length}개 카드를 성공적으로 가져왔습니다.`);
        setTimeout(() => setImportStatus('idle'), 3000);

      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        setImportStatus('error');
        setImportMessage(error instanceof Error ? error.message : 'JSON 파일 파싱에 실패했습니다.');
        setTimeout(() => setImportStatus('idle'), 5000);
      }
    };

    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('파일을 읽는 중 오류가 발생했습니다.');
      setTimeout(() => setImportStatus('idle'), 3000);
    };

    reader.readAsText(file);

    // 파일 input 초기화 (같은 파일 다시 선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // AI로 카드 내용 생성
  const handleAIGenerate = async () => {
    if (!editingCard || !aiInputName.trim()) {
      alert('역량카드명을 입력해주세요.');
      return;
    }

    setIsGenerating(true);

    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY || '';

      if (!apiKey) {
        // API 키가 없으면 샘플 데이터로 대체
        const sampleContent = generateSampleContent(aiInputName);
        setEditingCard({
          ...editingCard,
          competencyNameKo: aiInputName,
          competencyNameEn: sampleContent.nameEn,
          title: sampleContent.title,
          situation: sampleContent.situation,
          choices: sampleContent.choices,
          learningPoint: sampleContent.learningPoint
        });
        setIsGenerating(false);
        return;
      }

      const prompt = `당신은 기업 교육 콘텐츠 전문가입니다.
다음 역량에 대한 교육용 시나리오 카드를 만들어주세요.

역량명: ${aiInputName}
게임 모드: 커스텀

다음 JSON 형식으로 응답해주세요:
{
  "nameEn": "영문 역량명",
  "title": "시나리오 제목 (5-10자)",
  "situation": "직장에서 일어날 수 있는 구체적인 상황 설명 (150-200자). 딜레마나 선택이 필요한 상황으로 작성",
  "choices": [
    { "id": "A", "text": "선택지 A 설명 (30-50자)" },
    { "id": "B", "text": "선택지 B 설명 (30-50자)" },
    { "id": "C", "text": "선택지 C 설명 (30-50자)" }
  ],
  "learningPoint": "이 시나리오에서 배울 수 있는 핵심 교훈 (30-50자)"
}

JSON만 응답하세요.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          }
        })
      });

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // JSON 파싱
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setEditingCard({
          ...editingCard,
          competencyNameKo: aiInputName,
          competencyNameEn: parsed.nameEn || '',
          title: parsed.title || '',
          situation: parsed.situation || '',
          choices: parsed.choices || editingCard.choices,
          learningPoint: parsed.learningPoint || ''
        });
      }
    } catch (error) {
      console.error('AI 생성 오류:', error);
      // 오류 시 샘플 데이터 사용
      const sampleContent = generateSampleContent(aiInputName);
      setEditingCard({
        ...editingCard,
        competencyNameKo: aiInputName,
        competencyNameEn: sampleContent.nameEn,
        title: sampleContent.title,
        situation: sampleContent.situation,
        choices: sampleContent.choices,
        learningPoint: sampleContent.learningPoint
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 샘플 콘텐츠 생성 (API 없을 때 fallback)
  const generateSampleContent = (competencyName: string) => {
    return {
      nameEn: competencyName,
      title: `${competencyName}의 순간`,
      situation: `팀 프로젝트를 진행하는 중, ${competencyName}과 관련된 중요한 상황이 발생했습니다. 동료와의 의견 차이가 생겼고, 어떻게 대응할지 선택해야 합니다. 시간은 촉박하고, 결정에 따라 프로젝트 결과가 달라질 수 있습니다.`,
      choices: [
        { id: 'A', text: '기존 방식대로 진행한다. 안정성이 중요하다.' },
        { id: 'B', text: '동료와 충분히 대화하고, 함께 최선의 방법을 찾는다.' },
        { id: 'C', text: '상위 결정권자에게 판단을 맡긴다.' }
      ],
      learningPoint: `${competencyName}은 팀워크와 성과 모두에 영향을 미치는 핵심 역량이다`
    };
  };

  // 역량 정보 가져오기
  const getCompetencyInfo = (competencyId: string): CompetencyInfo | undefined => {
    return COMPETENCY_INFO.find(c => c.id === competencyId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Blue Marble Gamification</h2>
                <p className="text-indigo-200 text-sm">
                  커스텀 모드 카드 관리 (JSON 업로드)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 게임판 배경 이미지 설정 (모든 모드에서 사용 가능) */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-purple-700 mb-1">
                🖼️ 게임판 배경 이미지 (선택사항 - 비워두면 기본 이미지 사용)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={boardImage}
                  onChange={(e) => {
                    setBoardImage(e.target.value);
                    setHasChanges(true);
                    setUploadError(null);
                  }}
                  placeholder="https://example.com/background.png"
                  className="flex-1 px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                {/* 파일 업로드 버튼 */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors font-medium"
                  title="이미지 파일 업로드 (최대 3MB)"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4" />
                      파일 업로드
                    </>
                  )}
                </button>
              </div>
              {/* 에러 메시지 */}
              {uploadError && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </p>
              )}
              <p className="text-xs text-purple-600 mt-2">
                URL을 직접 입력하거나 이미지 파일을 업로드하세요. (JPG, PNG, GIF, WebP / 최대 3MB / 권장 크기: 800x800px)
              </p>
            </div>
            {boardImage && (
              <div className="shrink-0">
                <div className="text-xs text-gray-500 mb-1">미리보기</div>
                <img
                  src={boardImage}
                  alt="배경 미리보기"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-purple-300"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="20" fill="red">Error</text></svg>';
                  }}
                />
                {/* 이미지 삭제 버튼 */}
                <button
                  onClick={() => {
                    setBoardImage('');
                    setHasChanges(true);
                  }}
                  className="mt-1 text-xs text-red-500 hover:text-red-700 underline"
                >
                  이미지 제거
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI 분석 및 평가 지침 설정 */}
        <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-amber-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI 분석 및 평가 지침 (수정 가능)
            </label>
            <button
              onClick={() => setShowAiGuidelines(!showAiGuidelines)}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800"
            >
              {showAiGuidelines ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAiGuidelines ? '접기' : '펼치기'}
            </button>
          </div>

          {showAiGuidelines && (
            <div className="space-y-2">
              <textarea
                value={aiGuidelines}
                onChange={(e) => {
                  setAiGuidelines(e.target.value);
                  setHasChanges(true);
                }}
                rows={12}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                placeholder="AI 평가 지침을 입력하세요..."
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-600">
                  수정된 지침은 AI 분석 및 평가 시 적용됩니다. 저장 버튼을 눌러야 반영됩니다.
                </p>
                <button
                  onClick={() => {
                    setAiGuidelines(DEFAULT_AI_EVALUATION_GUIDELINES);
                    setHasChanges(true);
                  }}
                  className="text-xs text-amber-600 hover:text-amber-800 underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  기본값으로 초기화
                </button>
              </div>
            </div>
          )}

          {!showAiGuidelines && (
            <p className="text-xs text-amber-600">
              {aiGuidelines === DEFAULT_AI_EVALUATION_GUIDELINES
                ? '현재 기본 평가 지침이 적용됩니다.'
                : '✏️ 수정된 평가 지침이 적용됩니다.'}
            </p>
          )}
        </div>

        {/* 툴바 */}
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
          {/* 검색 */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="카드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">전체 카드</option>
              <option value="competency">역량 카드</option>
              <option value="event">이벤트 카드</option>
            </select>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* JSON 내보내기/가져오기 */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                title="JSON으로 내보내기"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">내보내기</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                title="JSON 파일 가져오기"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">가져오기</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              초기화
            </button>
            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || saveStatus === 'saving'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasChanges
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4" />
                  저장됨!
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  오류
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  전체 저장
                </>
              )}
            </button>
          </div>

          {/* 가져오기 상태 메시지 */}
          {importStatus !== 'idle' && (
            <div className={`w-full mt-2 p-3 rounded-lg flex items-center gap-2 ${
              importStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {importStatus === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm whitespace-pre-wrap">{importMessage}</span>
            </div>
          )}
        </div>

        {/* 카드 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm text-gray-500 mb-4">
            총 {filteredCards.length}개 카드 (31개 칸)
            <span className="ml-2 text-purple-600 font-medium">
              ※ 커스텀 모드: JSON 파일을 업로드하여 카드를 설정하세요
            </span>
          </div>

          <div className="space-y-3">
            {filteredCards.map((card) => {
              const isExpanded = expandedCardId === card.id;

              return (
                <div
                  key={card.id}
                  className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 카드 헤더 */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* 보드 위치 표시 */}
                      {card.boardIndex !== undefined ? (
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center font-bold text-indigo-700 text-sm">
                          {card.boardIndex}
                        </div>
                      ) : (
                        <div className={`w-3 h-3 rounded-full ${
                          card.type === 'CoreValue' ? 'bg-blue-500' :
                          card.type === 'Communication' ? 'bg-green-500' :
                          card.type === 'NewEmployee' ? 'bg-teal-500' :
                          card.type === 'Event' ? 'bg-yellow-500' :
                          card.type === 'Burnout' ? 'bg-red-500' :
                          card.type === 'Challenge' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`} />
                      )}
                      <div>
                        <div className="font-semibold text-gray-800">
                          {card.title}
                          {card.boardIndex !== undefined && (
                            <span className="ml-2 text-xs font-normal text-gray-400">(보드 {card.boardIndex}번 칸)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {card.competencyNameKo ? (
                            <span>{card.competencyNameKo} ({card.competencyNameEn})</span>
                          ) : card.competency ? (
                            <span>{getCompetencyInfo(card.competency)?.nameKo} ({getCompetencyInfo(card.competency)?.nameEn})</span>
                          ) : (
                            <span className="italic">{card.type} 카드</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCard(card);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* 확장된 내용 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t pt-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">상황</div>
                          <div className="text-gray-700 bg-white p-3 rounded-lg border">
                            {card.situation}
                          </div>
                        </div>

                        {card.choices && card.choices.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">선택지</div>
                            <div className="space-y-2">
                              {card.choices.map((choice, idx) => (
                                <div
                                  key={choice.id}
                                  className="flex items-start gap-2 bg-white p-3 rounded-lg border"
                                >
                                  <span className="font-bold text-indigo-600">{choice.id}.</span>
                                  <span className="text-gray-700">{choice.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">학습 포인트</div>
                          <div className="text-gray-700 bg-white p-3 rounded-lg border italic">
                            {card.learningPoint}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 편집 모달 */}
        {editingCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold text-gray-800">카드 편집</h3>
                <button
                  onClick={() => setEditingCard(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* AI 생성 섹션 */}
                {editingCard.competency && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">AI 자동 생성</span>
                    </div>

                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={aiInputName}
                        onChange={(e) => setAiInputName(e.target.value)}
                        placeholder="역량카드명 입력 (예: 적극적 경청)"
                        className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                      <button
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !aiInputName.trim()}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all font-medium ${
                          isGenerating || !aiInputName.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            AI 생성
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                      역량카드명을 입력하면 AI가 제목, 상황, 선택지, 학습포인트를 자동 생성합니다.
                    </p>
                  </div>
                )}

                {/* 역량카드명 (역량 카드인 경우에만) */}
                {editingCard.competency && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        역량카드명 (한글) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingCard.competencyNameKo || ''}
                        onChange={(e) => setEditingCard({ ...editingCard, competencyNameKo: e.target.value })}
                        placeholder="예: 적극적 경청"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        역량카드명 (영문)
                      </label>
                      <input
                        type="text"
                        value={editingCard.competencyNameEn || ''}
                        onChange={(e) => setEditingCard({ ...editingCard, competencyNameEn: e.target.value })}
                        placeholder="예: Active Listening"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={editingCard.title}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 상황 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상황 설명</label>
                  <textarea
                    value={editingCard.situation}
                    onChange={(e) => setEditingCard({ ...editingCard, situation: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 선택지 */}
                {editingCard.choices && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">선택지</label>
                    <div className="space-y-3">
                      {editingCard.choices.map((choice, idx) => (
                        <div key={choice.id} className="flex items-start gap-2">
                          <span className="font-bold text-indigo-600 mt-2 w-6">{choice.id}.</span>
                          <textarea
                            value={choice.text}
                            onChange={(e) => {
                              const newChoices = [...editingCard.choices!];
                              newChoices[idx] = { ...choice, text: e.target.value };
                              setEditingCard({ ...editingCard, choices: newChoices });
                            }}
                            rows={2}
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 학습 포인트 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">학습 포인트</label>
                  <textarea
                    value={editingCard.learningPoint}
                    onChange={(e) => setEditingCard({ ...editingCard, learningPoint: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditingCard(null)}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveCard}
                  className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
