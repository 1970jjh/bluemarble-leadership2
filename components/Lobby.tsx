import React, { useState } from 'react';
import { Session, GameVersion, SessionStatus } from '../types';

interface LobbyProps {
  sessions: Session[];
  onCreateSession: (name: string, version: GameVersion, teamCount: number, singlePieceMode?: boolean) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateStatus: (sessionId: string, status: SessionStatus) => void;
  onEnterSession: (session: Session) => void;
}

const statusLabels: Record<SessionStatus, string> = {
  active: '진행 중',
  paused: '일시정지',
  ended: '종료',
};

const statusColors: Record<SessionStatus, string> = {
  active: 'bg-green-400',
  paused: 'bg-yellow-400',
  ended: 'bg-gray-400',
};

const Lobby: React.FC<LobbyProps> = ({
  sessions,
  onCreateSession,
  onDeleteSession,
  onUpdateStatus,
  onEnterSession,
}) => {
  const [sessionName, setSessionName] = useState('');
  const [teamCount, setTeamCount] = useState(4);
  const [singlePieceMode, setSinglePieceMode] = useState(false);

  const handleCreate = () => {
    if (!sessionName.trim()) return;
    onCreateSession(sessionName.trim(), GameVersion.Custom, teamCount, singlePieceMode);
    setSessionName('');
    setTeamCount(4);
    setSinglePieceMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <h1 className="text-3xl font-black uppercase border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
          게임 세션 관리
        </h1>

        {/* Create Session Form */}
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2">
            새 게임 만들기
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block font-black text-sm mb-1">세션 이름</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="세션 이름 입력"
                className="w-full border-4 border-black p-3 font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-black text-sm mb-1">
                팀 수: {teamCount}
              </label>
              <input
                type="range"
                min={2}
                max={15}
                value={teamCount}
                onChange={(e) => setTeamCount(Number(e.target.value))}
                className="w-full accent-black"
              />
              <div className="flex justify-between text-xs font-black text-gray-500">
                <span>2</span>
                <span>15</span>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={singlePieceMode}
                onChange={(e) => setSinglePieceMode(e.target.checked)}
                className="w-5 h-5 border-4 border-black accent-black"
              />
              <span className="font-black">공통 말 모드</span>
            </label>

            <button
              onClick={handleCreate}
              disabled={!sessionName.trim()}
              className="w-full bg-blue-500 text-white font-black text-lg py-3 px-6 border-4 border-black hover:bg-blue-600 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              세션 생성
            </button>
          </div>
        </div>

        {/* Session List */}
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2">
            기존 세션 목록
          </h2>

          {sessions.length === 0 ? (
            <p className="text-gray-500 font-black text-center py-8">
              생성된 세션이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border-4 border-black p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg truncate">{session.name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span
                        className={`inline-block px-3 py-1 border-2 border-black font-black text-xs ${statusColors[session.status]}`}
                      >
                        {statusLabels[session.status]}
                      </span>
                      <span className="font-black text-sm text-gray-600">
                        팀 {session.teamCount}개
                      </span>
                      <span className="font-black text-xs text-gray-400">
                        코드: {session.accessCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEnterSession(session)}
                      className="bg-green-400 text-black font-black py-2 px-4 border-4 border-black hover:bg-green-500 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all text-sm"
                    >
                      입장
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="bg-red-400 text-black font-black py-2 px-4 border-4 border-black hover:bg-red-500 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
