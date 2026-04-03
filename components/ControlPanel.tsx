import React, { useState, useRef, useEffect } from 'react';
import { Team, GamePhase } from '../types';

// ============================================================
// Props
// ============================================================

interface ControlPanelProps {
  currentTeam: Team;
  teams: Team[];
  phase: GamePhase;
  diceValue: [number, number];
  rolling: boolean;
  onManualRoll: (total: number, teamIndex: number) => void;
  onOpenReport: () => void;
  onReset: () => void;
  logs: string[];
  isGameStarted: boolean;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  lastMoveInfo: { teamName: string; spaces: number } | null;
}

// ============================================================
// Phase label helper
// ============================================================

function phaseLabel(phase: GamePhase): string {
  switch (phase) {
    case GamePhase.Setup: return '설정 중';
    case GamePhase.Lobby: return '로비';
    case GamePhase.WaitingToStart: return '시작 대기';
    case GamePhase.Idle: return '대기';
    case GamePhase.Rolling: return '주사위 굴리는 중';
    case GamePhase.Moving: return '이동 중';
    case GamePhase.ShowingDiceResult: return '주사위 결과';
    case GamePhase.ShowingCompetencyCard: return '역량카드 미리보기';
    case GamePhase.Event: return '이벤트';
    case GamePhase.Decision: return '의사결정';
    case GamePhase.Result: return '결과';
    case GamePhase.Paused: return '일시정지';
    case GamePhase.End: return '종료';
    default: return String(phase);
  }
}

function phaseColor(phase: GamePhase): string {
  switch (phase) {
    case GamePhase.Idle:
    case GamePhase.WaitingToStart:
      return 'bg-gray-200';
    case GamePhase.Rolling:
    case GamePhase.Moving:
    case GamePhase.ShowingDiceResult:
      return 'bg-yellow-300';
    case GamePhase.Decision:
    case GamePhase.Event:
    case GamePhase.ShowingCompetencyCard:
      return 'bg-blue-300';
    case GamePhase.Result:
      return 'bg-green-300';
    case GamePhase.Paused:
      return 'bg-orange-300';
    case GamePhase.End:
      return 'bg-red-300';
    default:
      return 'bg-gray-200';
  }
}

// ============================================================
// Color mapping
// ============================================================

const TEAM_COLOR_CSS: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  Yellow: '#eab308',
  Purple: '#a855f7',
  Orange: '#f97316',
  Pink: '#ec4899',
  Teal: '#14b8a6',
  Cyan: '#06b6d4',
  Lime: '#84cc16',
  Indigo: '#6366f1',
  Amber: '#f59e0b',
  Emerald: '#10b981',
  Slate: '#64748b',
  Rose: '#f43f5e',
};

function getColorCSS(color: string): string {
  return TEAM_COLOR_CSS[color] || '#6b7280';
}

// ============================================================
// Component
// ============================================================

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentTeam,
  teams,
  phase,
  diceValue,
  rolling,
  onManualRoll,
  onOpenReport,
  onReset,
  logs,
  isGameStarted,
  onStartGame,
  onPauseGame,
  onResumeGame,
  lastMoveInfo,
}) => {
  const [manualDice, setManualDice] = useState<number>(7);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const handleRoll = () => {
    const clamped = Math.max(2, Math.min(12, manualDice));
    onManualRoll(clamped, selectedTeamIndex);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Game Status */}
      <div className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">게임 상태</div>
        <div className={`inline-block px-2 py-0.5 border-2 border-black font-black text-xs ${phaseColor(phase)}`}>
          {phaseLabel(phase)}
        </div>
      </div>

      {/* Current Team */}
      <div className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">현재 팀</div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-black flex-shrink-0"
            style={{ backgroundColor: getColorCSS(currentTeam.color) }}
          />
          <span className="font-black text-sm truncate">{currentTeam.name}</span>
        </div>
        {lastMoveInfo && (
          <div className="mt-1 text-[10px] font-bold text-gray-500">
            {lastMoveInfo.teamName}: {lastMoveInfo.spaces}칸 이동
          </div>
        )}
      </div>

      {/* Dice Control */}
      <div className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">주사위</div>

        {/* Dice value display */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-lg">
            {diceValue[0]}
          </div>
          <span className="font-black text-xs">+</span>
          <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-lg">
            {diceValue[1]}
          </div>
          <span className="font-black text-xs">=</span>
          <div className="w-8 h-8 bg-yellow-300 border-2 border-black flex items-center justify-center font-black text-lg">
            {diceValue[0] + diceValue[1]}
          </div>
        </div>

        {/* Manual dice input */}
        <div className="flex flex-col gap-1">
          <input
            type="number"
            min={2}
            max={12}
            value={manualDice}
            onChange={(e) => setManualDice(Number(e.target.value))}
            className="w-full border-2 border-black px-2 py-1 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <select
            value={selectedTeamIndex}
            onChange={(e) => setSelectedTeamIndex(Number(e.target.value))}
            className="w-full border-2 border-black px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {teams.map((team, idx) => (
              <option key={team.id} value={idx}>
                {team.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleRoll}
            disabled={rolling}
            className={`w-full py-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all ${
              rolling
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-500'
            }`}
          >
            {rolling ? '굴리는 중...' : '주사위'}
          </button>
        </div>
      </div>

      {/* Game Controls */}
      <div className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">게임 제어</div>
        <div className="flex flex-col gap-1">
          {!isGameStarted ? (
            <button
              onClick={onStartGame}
              className="w-full py-1.5 bg-green-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              게임 시작
            </button>
          ) : (
            <>
              {phase === GamePhase.Paused ? (
                <button
                  onClick={onResumeGame}
                  className="w-full py-1.5 bg-blue-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  재개
                </button>
              ) : (
                <button
                  onClick={onPauseGame}
                  className="w-full py-1.5 bg-orange-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  일시정지
                </button>
              )}
            </>
          )}
          <button
            onClick={onOpenReport}
            className="w-full py-1.5 bg-purple-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            리포트
          </button>
          <button
            onClick={onReset}
            className="w-full py-1.5 bg-red-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            리셋
          </button>
        </div>
      </div>

      {/* Game Logs */}
      <div className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-1 min-h-0 flex flex-col">
        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">게임 로그</div>
        <div className="flex-1 overflow-y-auto text-[10px] font-mono leading-tight space-y-0.5 min-h-0">
          {logs.length === 0 && (
            <div className="text-gray-400 italic">로그가 없습니다.</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="text-gray-700 border-b border-gray-100 pb-0.5">
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
