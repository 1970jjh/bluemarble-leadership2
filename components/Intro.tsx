import React, { useState, useEffect } from 'react';

interface IntroProps {
  onAdminLogin: () => void;
  onUserJoin: (accessCode: string) => void;
  initialAccessCode?: string;
  isLoading: boolean;
  joinError: string;
}

const Intro: React.FC<IntroProps> = ({
  onAdminLogin,
  onUserJoin,
  initialAccessCode,
  isLoading,
  joinError,
}) => {
  const [accessCode, setAccessCode] = useState(initialAccessCode || '');

  useEffect(() => {
    if (initialAccessCode) {
      setAccessCode(initialAccessCode);
    }
  }, [initialAccessCode]);

  const handleJoin = () => {
    if (accessCode.trim().length === 6) {
      onUserJoin(accessCode.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            브루마블 리더십 보드게임
          </h1>
          <p className="mt-4 text-lg font-black text-gray-700">
            Blue Marble Leadership Board Game
          </p>
        </div>

        {/* Admin Section */}
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2">
            관리자
          </h2>
          <button
            onClick={onAdminLogin}
            disabled={isLoading}
            className="w-full bg-black text-white font-black text-lg py-3 px-6 border-4 border-black hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            관리자 로그인
          </button>
        </div>

        {/* Participant Section */}
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2">
            참여자
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block font-black text-sm mb-1">
                참여 코드 (6자리)
              </label>
              <input
                type="text"
                maxLength={6}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                onKeyDown={handleKeyDown}
                placeholder="참여 코드 입력"
                className="w-full border-4 border-black p-3 font-black text-center text-2xl tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {joinError && (
              <p className="text-red-600 font-black text-sm border-2 border-red-600 bg-red-50 p-2">
                {joinError}
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={isLoading || accessCode.trim().length !== 6}
              className="w-full bg-blue-500 text-white font-black text-lg py-3 px-6 border-4 border-black hover:bg-blue-600 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  접속 중...
                </span>
              ) : (
                '참여하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;
