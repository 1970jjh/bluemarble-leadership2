import React from 'react';
import { Team, GamePhase, GameCard, Choice } from '../types';
import { MapPin, Dice5, Save, CheckCircle, Eye, MessageSquare, LogOut, BookOpen, Trophy } from 'lucide-react';
import { BOARD_SQUARES, getCharacterImage } from '../constants';

interface MobileTeamViewProps {
  team: Team;
  activeTeamName: string;
  isMyTurn: boolean;
  gamePhase: GamePhase;
  onLogout?: () => void;

  // Active Turn Props
  activeCard: GameCard | null;
  activeInput: { choice: Choice | null, reasoning: string };
  onInputChange: (choice: Choice, reason: string) => void;
  onSubmit: (choice?: Choice | null, reasoning?: string) => void;
  isTeamSaved: boolean;  // 팀이 저장했는지 여부
  isSaving: boolean;     // 저장 중 여부
  isGameStarted?: boolean;  // 게임 시작 여부
  isAiProcessing?: boolean;  // AI 분석 중 여부

  // 관람자 투표 (다른 팀 턴일 때)
  spectatorVote?: Choice | null;  // 관람자의 현재 선택
  onSpectatorVote?: (choice: Choice) => void;  // 관람자 투표 핸들러
  spectatorVotes?: { [optionId: string]: string[] };  // 다른 팀들의 투표 현황

  // 규칙서 보기
  teamNumber?: number;  // 팀 번호 (캐릭터 이미지용)
  onShowRules?: () => void;  // 규칙서 보기 핸들러

  // 전체 팀 점수 표시용
  allTeams?: Team[];
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
  isGameStarted = true,
  isAiProcessing = false,
  spectatorVote,
  onSpectatorVote,
  spectatorVotes = {},
  teamNumber = 1,
  onShowRules,
  allTeams = []
}) => {
  // 로컬 상태: 동시 사용자 입력 충돌 방지를 위해 로컬에서 관리
  const [localChoice, setLocalChoice] = React.useState<Choice | null>(null);
  const [localReasoning, setLocalReasoning] = React.useState('');

  // activeCard가 변경되면 로컬 상태 초기화 (새 카드가 나왔을 때)
  React.useEffect(() => {
    if (activeCard) {
      // 새 카드가 나오면 로컬 상태를 서버 상태로 초기화 (한 번만)
      setLocalChoice(activeInput.choice);
      setLocalReasoning(activeInput.reasoning);
    } else {
      // 카드가 없어지면 초기화
      setLocalChoice(null);
      setLocalReasoning('');
    }
  }, [activeCard?.id]); // activeCard의 id가 변경될 때만 실행

  const currentSquare = BOARD_SQUARES.find(s => s.index === team.position);

  // 저장 핸들러: 자유 서술 내용을 서버에 전달
  const handleSave = () => {
    if (localReasoning.trim()) {
      onInputChange(localChoice!, localReasoning);
      onSubmit(null, localReasoning);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-8 flex flex-col font-sans max-w-md mx-auto border-x-4 border-black bg-white">
      {/* Header */}
      <div className={`p-4 border-4 border-black mb-6 shadow-hard bg-${team.color.toLowerCase()}-100`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold uppercase text-gray-500">MY TEAM</h2>
            <h1 className="text-2xl font-black uppercase">{team.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 규칙서 보기 버튼 */}
            {onShowRules && (
              <button
                onClick={onShowRules}
                className="p-2 bg-blue-100 border-2 border-black hover:bg-blue-200 transition-colors"
                title="게임 규칙서"
              >
                <BookOpen size={16} />
              </button>
            )}
            {/* 팀 캐릭터 이미지 */}
            <img
              src={getCharacterImage(teamNumber)}
              alt={`Team ${teamNumber}`}
              className="w-10 h-10 object-contain border-2 border-black rounded-lg bg-white p-0.5"
            />
            {onLogout && (
              <button
                onClick={() => {
                  if (window.confirm('정말 로그아웃 하시겠습니까?')) {
                    onLogout();
                  }
                }}
                className="p-2 bg-gray-200 border-2 border-black hover:bg-red-100 transition-colors"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
        {/* 팀원 목록 표시 */}
        {team.members.length > 0 && (
          <div className="mt-2 text-sm text-gray-600 truncate">
            <span className="font-bold">팀원: </span>
            {team.members.map(m => m.name).join(', ')}
          </div>
        )}
      </div>

      {/* --- DECISION CARD VIEW (Active or Spectator) --- */}
      {activeCard && (
        <div className="mb-6 animate-in slide-in-from-bottom-5">
           {/* Header depends on Turn */}
           {isMyTurn ? (
             <div className="bg-black text-white p-3 border-4 border-black mb-2">
               <h3 className="font-bold text-sm uppercase text-yellow-400">Decision Required</h3>
               <h2 className="text-xl font-black leading-tight">{activeCard.title}</h2>
             </div>
           ) : (
             <div className="bg-purple-100 text-purple-800 p-3 border-4 border-purple-500 mb-2">
               <div className="flex items-center gap-2 mb-1">
                 <Eye size={18} />
                 <h3 className="font-bold text-xs uppercase">Spectating {activeTeamName}</h3>
               </div>
               <h2 className="text-lg font-black leading-tight text-black">{activeCard.title}</h2>
               <p className="text-xs mt-1 text-purple-600">
                 💡 나도 선택에 참여할 수 있습니다! (투표만, 점수 반영 없음)
               </p>
             </div>
           )}

           <div className="bg-white border-4 border-black p-4 mb-4">
             <p className="font-medium text-gray-800 mb-4 text-sm">"{activeCard.situation}"</p>

             {/* AI 분석 중 표시 */}
             {isAiProcessing && (
               <div className="bg-purple-100 border-4 border-purple-500 p-4 text-center mb-4 animate-pulse">
                 <div className="flex items-center justify-center gap-3">
                   <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                   <span className="font-bold text-purple-800">(AI 분석 중...)</span>
                 </div>
               </div>
             )}

             {/* 저장 완료 상태 */}
             {isTeamSaved ? (
               <div className="bg-green-100 border-4 border-green-600 p-6 text-center">
                 <CheckCircle className="mx-auto mb-3 text-green-600" size={48} />
                 <h3 className="text-lg font-black text-green-800 mb-2">저장 완료!</h3>
                 <p className="text-sm text-green-700 font-medium">
                   {isAiProcessing ? (
                     <>AI가 분석 중입니다...<br/>잠시만 기다려주세요.</>
                   ) : (
                     <>관리자가 AI 분석을 진행할 예정입니다.<br/>잠시만 기다려주세요.</>
                   )}
                 </p>
               </div>
             ) : (
               <>
                 {/* 안내 문구 */}
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 p-3 rounded-lg mb-4">
                   <h3 className="text-base font-black text-blue-800 mb-1">나는 어떻게 할 것인가?</h3>
                   <p className="text-xs font-medium text-blue-700">자신의 행동과 이유를 작성해주세요!</p>
                 </div>

                 {/* 자유 서술 입력란 (150자 이내) */}
                 {isMyTurn ? (
                   <>
                     <textarea
                       value={localReasoning}
                       onChange={(e) => {
                         if (e.target.value.length <= 150) setLocalReasoning(e.target.value);
                       }}
                       maxLength={150}
                       placeholder="이 상황에서 나라면 어떻게 할 것인지, 그 이유와 함께 자유롭게 작성해주세요... (150자 이내)"
                       className="w-full p-2 border-2 border-black font-medium text-sm focus:outline-none focus:bg-yellow-50 mb-1 h-32 resize-none"
                     />
                     <div className={`text-right text-xs mb-3 ${localReasoning.length >= 150 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                       {localReasoning.length} / 150자
                     </div>

                     <button
                       onClick={handleSave}
                       disabled={!localReasoning.trim() || isSaving}
                       className="w-full py-3 bg-blue-600 text-white font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {isSaving ? (
                         <>
                           <Save className="animate-pulse" size={16} />
                           저장 중...
                         </>
                       ) : (
                         <>
                           <Save size={16} />
                           저장하기
                         </>
                       )}
                     </button>
                   </>
                 ) : (
                    <div className="w-full py-3 bg-gray-200 text-gray-500 font-bold uppercase text-center border-2 border-transparent">
                       팀 입력 대기 중...
                    </div>
                 )}
               </>
             )}
           </div>
        </div>
      )}

      {/* --- IDLE STATE (Your Board Info) --- */}
      {!activeCard && (
        <div className="mb-8">
          <div className="mb-4 relative">
             <div className="bg-white border-4 border-black p-6 pt-8 text-center shadow-hard">
                <MapPin className="mx-auto mb-2 text-blue-900" size={32} />
                <h3 className="text-xl font-black uppercase leading-tight">{currentSquare?.name}</h3>
             </div>
          </div>

          {/* 게임 상태 표시 (관리자가 주사위 입력) */}
          {!isGameStarted || gamePhase === GamePhase.WaitingToStart ? (
            <div className="w-full py-6 border-4 border-black text-xl font-black shadow-hard uppercase flex flex-col items-center justify-center gap-2 bg-gray-200 text-gray-600">
              <div className="animate-pulse">⏳</div>
              <span>게임 시작 대기 중</span>
            </div>
          ) : gamePhase === GamePhase.Paused ? (
            <div className="w-full py-6 border-4 border-black text-xl font-black shadow-hard uppercase flex flex-col items-center justify-center gap-2 bg-orange-100 text-orange-700">
              <div>⏸️</div>
              <span>게임 일시정지 중</span>
            </div>
          ) : gamePhase === GamePhase.Rolling ? (
            <div className="w-full py-6 border-4 border-black text-xl font-black shadow-hard uppercase flex flex-col items-center justify-center gap-2 bg-yellow-100 text-yellow-700">
              <Dice5 size={28} className="animate-spin" />
              <span>주사위 굴리는 중...</span>
            </div>
          ) : gamePhase === GamePhase.Moving ? (
            <div className="w-full py-6 border-4 border-black text-xl font-black shadow-hard uppercase flex flex-col items-center justify-center gap-2 bg-blue-100 text-blue-700">
              <MapPin size={28} />
              <span>이동 중...</span>
            </div>
          ) : (
            <div className="w-full py-8 border-4 border-gray-400 text-2xl font-black shadow-hard flex flex-col items-center justify-center gap-2 bg-gray-200 text-gray-700 uppercase tracking-wider">
              <div className="animate-pulse text-3xl">⏳</div>
              <span>WAITING</span>
            </div>
          )}
        </div>
      )}

      {/* All Team Scores */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-4 border-blue-500 p-4 shadow-hard">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy size={18} className="text-blue-600" />
          <span className="text-sm font-bold uppercase text-blue-600">팀 점수 현황</span>
        </div>

        {/* 전체 팀 점수 그리드 */}
        <div className="grid grid-cols-2 gap-2">
          {(allTeams.length > 0 ? allTeams : [team])
            .sort((a, b) => (b.score ?? 100) - (a.score ?? 100))
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
                <div className="flex items-center justify-center gap-1 mb-1">
                  {index === 0 && <span className="text-lg">🥇</span>}
                  {index === 1 && <span className="text-lg">🥈</span>}
                  {index === 2 && <span className="text-lg">🥉</span>}
                  <span className={`text-sm font-bold ${t.id === team.id ? 'text-blue-800' : 'text-gray-700'}`}>
                    {t.name}
                    {t.id === team.id && <span className="text-blue-600 ml-1">(우리)</span>}
                  </span>
                </div>
                <div className={`text-2xl font-black ${t.id === team.id ? 'text-blue-800' : 'text-gray-800'}`}>
                  {t.score ?? 100}점
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default MobileTeamView;